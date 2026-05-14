import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as net from 'net';
import { spawn, ChildProcess } from 'child_process';
import { Readable, PassThrough } from 'stream';
import { JT1078Parser, JT1078Packet, DATA_TYPE, JT1078_HEADER_LEN, SUB_PACKET, PT } from '../tcp-server/jt1078.parser';
import { JT808Parser, MsgId } from '../tcp-server/jt808.parser';
import { VideoRecordingsService } from '../video-recordings/video-recordings.service';
import { MediaServerGateway } from './media-server.gateway';
import { S3Service } from '../s3/s3.service';
import { TcpServerService } from '../tcp-server/tcp-server.service';
import { DevicesService } from '../devices/devices.service';

interface ActiveMediaSession {
  socket: net.Socket;
  simNumber: string;
  channel: number;
  started: Date;
  lastPacket: Date;
  buffer: Buffer;
  // Recording state
  recordingId?: number;
  recordingDurationSec: number;
  recordingTimer?: NodeJS.Timeout;
  frameChunks: Buffer[];        // raw frames accumulated (H.264 Annex-B or G.711A alaw)
  totalBytes: number;
  ffmpegProcess?: ChildProcess;
  ffmpegPipe?: PassThrough;
  mp4Chunks: Buffer[];          // ffmpeg output (MP4 bytes)
  fragmentBuffer: Buffer;       // reassembly buffer for fragmented JT1078 packets
  liveTranscoderPipe?: PassThrough;  // H.265→H.264 live transcoder input pipe
  serialNo: number;             // platform→device sequence counter for JT808 responses
  liveRecording: boolean;       // true while async live-recording setup is pending
  finalizeRetry: number;        // retry counter for finalizeSession race-condition guard
  isAudioStream: boolean;       // true when the device streams G.711A audio (no video)
}

@Injectable()
export class MediaServerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('MediaServer');
  private server!: net.Server;
  private sessions = new Map<string, ActiveMediaSession>();
  private readonly ALARM_DURATION_SEC = 10;

  constructor(
    private videoRecordingsService: VideoRecordingsService,
    private gateway: MediaServerGateway,
    private s3: S3Service,
    private tcpServerService: TcpServerService,
    private devicesService: DevicesService,
  ) {}

  onModuleInit() {
    this.startMediaServer();
  }

  onModuleDestroy() {
    this.server?.close();
    for (const [, session] of this.sessions) {
      session.socket.destroy();
    }
  }

  private startMediaServer() {
    const port = parseInt(process.env.MEDIA_SERVER_PORT || '8880');
    this.server = net.createServer((socket) => this.handleMediaConnection(socket));

    this.server.listen(port, () => {
      this.logger.log(`JT1078 Media Server listening on port ${port}`);
    });

    this.server.on('error', (err) => {
      this.logger.error(`Media Server error: ${err.message}`);
    });
  }

  private handleMediaConnection(socket: net.Socket) {
    const sessionId = `${socket.remoteAddress}:${socket.remotePort}`;
    this.logger.log(`Media connection from ${sessionId}`);

    const session: ActiveMediaSession = {
      socket,
      simNumber: '',
      channel: 1,
      started: new Date(),
      lastPacket: new Date(),
      buffer: Buffer.alloc(0),
      recordingDurationSec: this.ALARM_DURATION_SEC,
      frameChunks: [],
      totalBytes: 0,
      mp4Chunks: [],
      fragmentBuffer: Buffer.alloc(0),
      serialNo: 0,
      liveRecording: false,
      finalizeRetry: 0,
      isAudioStream: false,
    };

    socket.on('data', (data) => {
      // Only log non-JT1078 data (JT1078 starts with 30316364) or unusual sizes for debugging
      if (data[0] !== 0x30 || data[1] !== 0x31 || data[2] !== 0x63 || data[3] !== 0x64) {
        this.logger.debug(`MEDIA [${sessionId}] ${data.length}b: ${data.subarray(0, 32).toString('hex')}`);
      }
      session.buffer = Buffer.concat([session.buffer, data]);
      session.lastPacket = new Date();
      this.processMediaBuffer(session, sessionId);
    });

    socket.on('close', () => {
      this.logger.log(`Media stream closed: ${sessionId} (${session.simNumber})`);
      this.finalizeSession(session);
      this.sessions.delete(sessionId);
    });

    socket.on('error', (err) => {
      this.logger.error(`Media socket error [${sessionId}]: ${err.message}`);
      this.sessions.delete(sessionId);
    });

    socket.setTimeout(300_000);
    socket.on('timeout', () => {
      this.logger.warn(`Media socket timeout: ${sessionId}`);
      socket.destroy();
    });

    this.sessions.set(sessionId, session);
  }

  private processMediaBuffer(session: ActiveMediaSession, sessionId: string) {
    while (true) {
      if (session.buffer.length === 0) break;

      // ── JT1078 with magic ───────────────────────────────────────────────────
      const jt1078Magic = Buffer.from([0x30, 0x31, 0x63, 0x64]);
      const magicPos = session.buffer.indexOf(jt1078Magic);

      if (magicPos === 0) {
        // Magic is right at the start — try to parse
        if (session.buffer.length < JT1078_HEADER_LEN) break;
        const dataLen = session.buffer.readUInt16BE(24); // offset 24 in 26-byte header
        if (dataLen > 65000) {
          // Sanity check failed — skip 4 bytes and retry
          session.buffer = session.buffer.subarray(4);
          continue;
        }
        const totalLen = JT1078_HEADER_LEN + dataLen;
        if (session.buffer.length < totalLen) break;
        const packet = JT1078Parser.parsePacket(session.buffer);
        session.buffer = session.buffer.subarray(totalLen);
        if (packet) this.handleJT1078Packet(packet, session, sessionId);
        continue;
      }

      if (magicPos > 0) {
        // Skip garbage before magic
        session.buffer = session.buffer.subarray(magicPos);
        continue;
      }

      // ── JT1078 without magic (22-byte header starting with RTP flags) ───────
      // Device sometimes sends packets without the 4-byte magic prefix.
      // Detect: first byte has high bit set (0x80|CC) and second byte has high bit (M|PT).
      if (session.buffer.length >= 22 &&
          (session.buffer[0] & 0xc0) === 0x80 &&
          (session.buffer[1] & 0x80) === 0x80) {
        const dataLen = session.buffer.readUInt16BE(20); // dataLen at offset 20 in 22-byte header
        if (dataLen > 0 && dataLen <= 65000 && session.buffer.length >= 22 + dataLen) {
          // Build a fake-magic prefix so parsePacket works
          const withMagic = Buffer.concat([jt1078Magic, session.buffer.subarray(0, 22 + dataLen)]);
          const packet = JT1078Parser.parsePacket(withMagic);
          session.buffer = session.buffer.subarray(22 + dataLen);
          if (packet) this.handleJT1078Packet(packet, session, sessionId);
          continue;
        }
      }

      // ── JT808 ───────────────────────────────────────────────────────────────
      const jt808Start = session.buffer.indexOf(0x7e);
      if (jt808Start === -1) {
        // No recognizable header found.
        // If session is already identified, treat all buffered data as raw video.
        if (session.simNumber && session.buffer.length > 0) {
          const raw = session.buffer;
          session.buffer = Buffer.alloc(0);
          this.forwardRawVideoChunk(raw, session);
        } else if (session.buffer.length > 3) {
          session.buffer = session.buffer.subarray(session.buffer.length - 3);
        }
        break;
      }
      if (jt808Start > 0) {
        // Data before the JT808 frame — forward as raw video if session identified
        if (session.simNumber) {
          this.forwardRawVideoChunk(session.buffer.subarray(0, jt808Start), session);
        }
        session.buffer = session.buffer.subarray(jt808Start);
        continue;
      }
      const jt808End = session.buffer.indexOf(0x7e, 1);
      if (jt808End === -1) break;
      const frame = session.buffer.subarray(0, jt808End + 1);
      session.buffer = session.buffer.subarray(jt808End + 1);
      try {
        const message = JT808Parser.parseFrame(frame);
        if (message) this.handleJT808Message(message, session, sessionId);
      } catch (err: any) {
        this.logger.warn(`JT808 parse error in media: ${err.message}`);
      }
    }
  }

  private forwardRawVideoChunk(data: Buffer, session: ActiveMediaSession) {
    if (data.length === 0 || !session.simNumber) return;
    // If this session has been identified as audio-only, emit as audio_frame
    if (session.isAudioStream) {
      this.gateway.emitAudioFrame(session.simNumber, session.channel, data);
    } else {
      this.gateway.emitFrame(session.simNumber, session.channel, data, false);
    }
    if (session.recordingId !== undefined || session.liveRecording) {
      session.frameChunks.push(data);
      session.totalBytes += data.length;
      if (session.ffmpegPipe && !session.isAudioStream) {
        try { session.ffmpegPipe.write(data); } catch { /* pipe closed */ }
      }
    }
  }

  private handleJT808Message(message: any, session: ActiveMediaSession, sessionId: string) {
    const { messageId, phoneNumber, messageBody, serialNumber } = message;

    // Initialize stream on first contact
    if (!session.simNumber) {
      session.simNumber = phoneNumber;
      session.channel = 1;
      this.logger.log(`JT808 Stream identified: SIM=${phoneNumber} ch=${session.channel}`);
    }

    session.serialNo++;

    switch (messageId) {
      // ── Authentication (0x0102): device authenticates before sending video ─────
      case MsgId.TERMINAL_AUTH: {
        this.logger.log(`Media port auth from ${phoneNumber} — sending ACK`);
        session.socket.write(
          JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, MsgId.TERMINAL_AUTH, 0),
        );
        const mediaIp   = process.env.MEDIA_SERVER_PUBLIC_IP || '34.228.231.76';
        const mediaPort = parseInt(process.env.MEDIA_SERVER_PORT || '8880', 10);

        // Send 0x9101 DIRECTLY on this 8880 socket — some devices stream on the
        // existing media connection rather than opening a new one.
        session.serialNo++;
        const directPkt = JT808Parser.buildRealtimeVideoRequest(
          phoneNumber, session.serialNo, mediaIp, mediaPort, mediaPort,
          session.channel, 0, 0,  // dataType=0 → audio+video; streamType=0 → main stream
        );
        session.socket.write(directPkt);
        this.logger.log(`Sent 0x9101 DIRECT on media socket for ${phoneNumber} ch=${session.channel}: ${directPkt.toString('hex')}`);

        // Also send via the control channel (8808) in case the device uses a separate video connection
        this.tcpServerService.sendRealtimeVideoRequest(
          phoneNumber, mediaIp, mediaPort, mediaPort, session.channel, 0, 0,
        ).then(sent => this.logger.log(`Triggered 0x9101 via TCP control for ${phoneNumber}: sent=${sent}`))
          .catch(() => {});
        this.gateway.emitStreamEvent(phoneNumber, session.channel, 'live');
        break;
      }

      // ── Registration (0x0100): some devices register before streaming ─────────
      case MsgId.TERMINAL_REGISTER:
        this.logger.log(`Media port register from ${phoneNumber} — sending ACK`);
        session.socket.write(
          JT808Parser.buildRegistrationResponse(phoneNumber, session.serialNo, serialNumber, 0, `AUTH_${phoneNumber.slice(-6)}`),
        );
        break;

      // ── Heartbeat (0x0002): keep connection alive ─────────────────────────────
      case MsgId.HEARTBEAT:
        session.socket.write(
          JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, MsgId.HEARTBEAT, 0),
        );
        break;

      // ── Multimedia data (0x0801): actual video/photo frame ────────────────────
      case MsgId.MULTIMEDIA_DATA:
        this.logger.debug(`MULTIMEDIA_DATA from ${phoneNumber}`);
        try {
          const media = JT808Parser.parseMultimediaData(messageBody);
          if (media.mediaType === 0 || media.mediaType === 4) {
            this.logger.log(`Video frame received: ${media.data.length}b from ${phoneNumber}`);
            this.gateway.emitFrame(session.simNumber, session.channel, media.data, true);
            if (session.recordingId !== undefined) {
              session.frameChunks.push(media.data);
              session.totalBytes += media.data.length;
            }
          }
          // ACK the multimedia upload
          session.socket.write(
            JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, MsgId.MULTIMEDIA_DATA, 0),
          );
        } catch (err: any) {
          this.logger.error(`Failed to parse multimedia data: ${err.message}`);
        }
        break;

      // ── Location/bulk — ignore ─────────────────────────────────────────────────
      case MsgId.LOCATION_BULK:
      case MsgId.LOCATION_REPORT:
        this.logger.debug(`Location msg on media port from ${phoneNumber} (ignored)`);
        break;

      // ── General response from device — no reply needed ────────────────────────
      case MsgId.TERMINAL_GENERAL_RESPONSE:
        break;

      default:
        this.logger.debug(`Other JT808 msg=0x${messageId.toString(16).padStart(4, '0')} on media port from ${phoneNumber}`);
        // Send a general ACK so the device knows the platform is alive
        session.socket.write(
          JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, messageId, 0),
        );
    }
  }

  private handleJT1078Packet(packet: JT1078Packet, session: ActiveMediaSession, sessionId: string) {
    // First packet — identify the stream
    if (!session.simNumber) {
      session.simNumber = packet.simNumber;
      session.channel   = packet.channel;
      this.logger.log(
        `Stream identified: SIM=${packet.simNumber} ch=${packet.channel} PT=${JT1078Parser.payloadTypeName(packet.payloadType)} ` +
        `dataType=${packet.dataType} subPkt=${packet.subPacketType} seq=${packet.sequence} len=${packet.dataLength} ` +
        `payload[0..15]=${packet.data.subarray(0, 16).toString('hex')}`,
      );

      // Check if there is a pending alarm capture for this device
      const pendingCapture = this.videoRecordingsService.getPendingCapture(packet.simNumber);
      if (pendingCapture) {
        session.recordingId = pendingCapture.recordingId;
        session.recordingDurationSec = this.ALARM_DURATION_SEC;
        this.videoRecordingsService.markRecordingStarted(packet.simNumber);
        this.gateway.emitStreamEvent(packet.simNumber, packet.channel, 'started', { recordingId: session.recordingId });
        this.startRecordingTimer(session);
      } else {
        // Live stream — record to S3 for playback and forward to WebSocket
        session.liveRecording = true;
        // Don't start ffmpeg yet — wait until we know whether it's audio or video
        this.setupLiveRecording(session, packet.simNumber, packet.channel).catch(
          (err) => this.logger.warn(`Live recording setup failed for ${packet.simNumber}: ${err.message}`),
        );
        this.gateway.emitStreamEvent(packet.simNumber, packet.channel, 'live');
      }

      this.sessions.set(sessionId, session);
    }

    const isVideo    = JT1078Parser.isVideoFrame(packet);
    const isKeyFrame = JT1078Parser.isKeyFrame(packet);
    const isAudio    = JT1078Parser.isAudio(packet);

    // ── Live relay via WebSocket ──────────────────────────────────────────────
    if (isVideo) {
      // Reassemble fragmented JT1078 packets before decoding.
      // Large H.264 frames are split into FIRST/MIDDLE/LAST sub-packets;
      // forwarding fragments individually causes corrupted/blurry video.
      let frameData: Buffer | null = null;

      switch (packet.subPacketType) {
        case SUB_PACKET.FIRST:
          session.fragmentBuffer = Buffer.from(packet.data);
          break;
        case SUB_PACKET.MIDDLE:
          session.fragmentBuffer = Buffer.concat([session.fragmentBuffer, packet.data]);
          break;
        case SUB_PACKET.LAST:
          session.fragmentBuffer = Buffer.concat([session.fragmentBuffer, packet.data]);
          frameData = session.fragmentBuffer;
          session.fragmentBuffer = Buffer.alloc(0);
          break;
        default:
          // ATOMIC (0): complete frame — use directly
          frameData = packet.data;
      }

      if (frameData !== null) {
        // PT=6 is T98 device-specific G.711A audio — firmware marks it as I_FRAME
        // but the payload is raw 8-bit PCM A-law audio at 8000 Hz.
        const isAlawAudio = packet.payloadType === 6 || packet.payloadType === PT.G711A;

        if (isAlawAudio) {
          session.isAudioStream = true;
          this.gateway.emitAudioFrame(session.simNumber, session.channel, frameData);
          if (session.recordingId !== undefined || session.liveRecording) {
            session.frameChunks.push(frameData);
            session.totalBytes += frameData.length;
          }
        } else if (packet.payloadType === PT.H265) {
          // H.265 stream: start a per-session ffmpeg transcoder (H.265→H.264)
          if (!session.liveTranscoderPipe) {
            this.startLiveTranscoder(session, sessionId);
          }
          if (session.liveTranscoderPipe) {
            try { session.liveTranscoderPipe.write(JT1078Parser.toAnnexB(frameData)); } catch { /* ignore */ }
          }
        } else {
          // H.264: start ffmpeg lazily (now we know it's video), convert to Annex-B and forward
          if (!session.ffmpegPipe && (session.recordingId !== undefined || session.liveRecording)) {
            this.startFfmpegPipe(session);
          }
          const annexB = JT1078Parser.toAnnexB(frameData);
          this.gateway.emitFrame(session.simNumber, session.channel, annexB, isKeyFrame);
          if (session.recordingId !== undefined || session.liveRecording) {
            session.frameChunks.push(annexB);
            session.totalBytes += annexB.length;
            if (session.ffmpegPipe) {
              try { session.ffmpegPipe.write(annexB); } catch { /* pipe closed */ }
            }
          }
        }
      }
    } else if (isAudio) {
      // Standard audio frame (dataType=3) — forward as audio if identified
      if (session.simNumber) {
        this.gateway.emitAudioFrame(session.simNumber, session.channel, packet.data);
      }
    }
  }

  // ── Recording Timer ─────────────────────────────────────────────────────────

  private startRecordingTimer(session: ActiveMediaSession) {
    session.recordingTimer = setTimeout(() => {
      this.logger.log(`Recording timer expired for ${session.simNumber}`);
      session.socket.destroy(); // triggers 'close' event → finalizeSession
    }, session.recordingDurationSec * 1000);
  }

  private startFfmpegPipe(session: ActiveMediaSession) {
    try {
      const ffmpeg = spawn('ffmpeg', [
        '-loglevel', 'error',
        '-f', 'h264',
        '-i', 'pipe:0',
        '-c:v', 'copy',
        '-movflags', 'frag_keyframe+empty_moov+faststart',
        '-f', 'mp4',
        'pipe:1',
      ]);

      const pipe = new PassThrough();
      pipe.pipe(ffmpeg.stdin);
      session.ffmpegPipe = pipe;
      session.ffmpegProcess = ffmpeg;

      ffmpeg.stdout.on('data', (chunk: Buffer) => {
        session.mp4Chunks.push(chunk);
      });

      ffmpeg.on('error', (err) => {
        this.logger.warn(`ffmpeg not available: ${err.message} — will save raw H.264`);
        session.ffmpegPipe = undefined;
        session.ffmpegProcess = undefined;
      });

      ffmpeg.on('close', (code) => {
        this.logger.debug(`ffmpeg exited with code ${code} for ${session.simNumber}`);
      });
    } catch (err: any) {
      this.logger.warn(`Could not spawn ffmpeg: ${err.message} — will save raw H.264`);
    }
  }

  private startLiveTranscoder(session: ActiveMediaSession, sessionId: string) {
    this.logger.log(`Starting H.265→H.264 live transcoder for ${session.simNumber} ch${session.channel}`);
    try {
      const ffmpeg = spawn('ffmpeg', [
        '-loglevel', 'error',
        '-f', 'hevc',
        '-i', 'pipe:0',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-profile:v', 'baseline',
        '-level', '3.1',
        '-f', 'h264',
        'pipe:1',
      ]);

      const pipe = new PassThrough();
      pipe.pipe(ffmpeg.stdin);
      session.liveTranscoderPipe = pipe;

      ffmpeg.stdout.on('data', (chunk: Buffer) => {
        this.gateway.emitFrame(session.simNumber, session.channel, chunk, false);
        if (session.recordingId !== undefined) {
          session.frameChunks.push(chunk);
          session.totalBytes += chunk.length;
          if (session.ffmpegPipe) {
            try { session.ffmpegPipe.write(chunk); } catch { /* pipe closed */ }
          }
        }
      });

      ffmpeg.on('error', (err) => {
        this.logger.warn(`Live transcoder error for ${session.simNumber}: ${err.message}`);
        session.liveTranscoderPipe = undefined;
      });

      ffmpeg.on('close', () => {
        session.liveTranscoderPipe = undefined;
      });
    } catch (err: any) {
      this.logger.warn(`Could not start H.265 live transcoder for ${sessionId}: ${err.message}`);
    }
  }

  // ── Live Recording Setup (async) ────────────────────────────────────────────

  private async setupLiveRecording(session: ActiveMediaSession, simNumber: string, channel: number) {
    const device = await this.devicesService.findBySimNumber(simNumber).catch(() => null)
                || await this.devicesService.findByImei(simNumber).catch(() => null);
    if (!device) {
      this.logger.warn(`setupLiveRecording: no device found for simNumber=${simNumber}`);
      return;
    }
    const recordingId = await this.videoRecordingsService.startLiveRecording(
      simNumber, device.id, device.name, channel,
    );
    session.recordingId = recordingId;
    this.logger.log(`Live recording started: id=${recordingId} sim=${simNumber} ch=${channel}`);
  }

  // ── Finalize Session (on close) ─────────────────────────────────────────────

  private finalizeSession(session: ActiveMediaSession) {
    if (session.recordingTimer) {
      clearTimeout(session.recordingTimer);
    }

    // Clean up live H.265 transcoder if active
    if (session.liveTranscoderPipe) {
      try { session.liveTranscoderPipe.end(); } catch { /* ignore */ }
      session.liveTranscoderPipe = undefined;
    }

    if (!session.recordingId) {
      if (session.liveRecording && session.frameChunks.length > 0) {
        // DB record setup is async — retry up to 10× (every 500 ms) waiting for recordingId
        session.finalizeRetry++;
        if (session.finalizeRetry <= 10) {
          setTimeout(() => this.finalizeSession(session), 500);
          return;
        }
        this.logger.warn(`Live recording for ${session.simNumber} lost — no recording ID after retries`);
      }
      if (session.simNumber) {
        this.gateway.emitStreamEvent(session.simNumber, session.channel, 'stopped');
      }
      return;
    }

    const durationMs = Date.now() - session.started.getTime();
    const durationSec = Math.round(durationMs / 1000);

    this.gateway.emitStreamEvent(session.simNumber, session.channel, 'recording_complete', {
      recordingId: session.recordingId,
      durationSec,
    });

    // Audio-only stream: save raw G.711A bytes to S3
    if (session.isAudioStream) {
      this.saveRawAlawRecording(session, durationSec);
      return;
    }

    if (session.ffmpegProcess && session.mp4Chunks.length > 0) {
      // Close ffmpeg stdin and wait for output
      try {
        session.ffmpegPipe?.end();
        // Give ffmpeg 5s to flush then upload
        setTimeout(() => {
          if (session.mp4Chunks.length > 0) {
            const mp4 = Buffer.concat(session.mp4Chunks);
            this.videoRecordingsService
              .finalizeVideoRecording(session.simNumber, mp4, durationSec)
              .catch((err) => this.logger.error(`Finalize error: ${err.message}`));
          } else {
            this.saveRawH264(session, durationSec);
          }
        }, 5000);
      } catch {
        this.saveRawH264(session, durationSec);
      }
    } else {
      this.saveRawH264(session, durationSec);
    }
  }

  private saveRawH264(session: ActiveMediaSession, durationSec: number) {
    if (session.frameChunks.length === 0) return;
    const raw = Buffer.concat(session.frameChunks);
    this.videoRecordingsService
      .finalizeRawH264Recording(session.simNumber, raw, durationSec)
      .catch((err) => this.logger.error(`Raw H264 save error: ${err.message}`));
  }

  private saveRawAlawRecording(session: ActiveMediaSession, durationSec: number) {
    if (session.frameChunks.length === 0) return;
    const raw = Buffer.concat(session.frameChunks);
    // G.711A is 8000 bytes/second — derive accurate duration from byte count
    const audioDurationSec = Math.round(raw.length / 8000) || durationSec;
    this.videoRecordingsService
      .finalizeRawAlawRecording(session.simNumber, raw, audioDurationSec)
      .catch((err) => this.logger.error(`Raw alaw save error: ${err.message}`));
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  getActiveStreams() {
    const streams: Array<{ simNumber: string; channel: number; started: Date; isRecording: boolean }> = [];
    for (const [, s] of this.sessions) {
      if (s.simNumber) {
        streams.push({
          simNumber: s.simNumber,
          channel: s.channel,
          started: s.started,
          isRecording: s.recordingId !== undefined,
        });
      }
    }
    return streams;
  }

  forceStopStream(imei: string, channel = 1) {
    for (const [, s] of this.sessions) {
      if (s.simNumber === imei && s.channel === channel) {
        s.socket.destroy();
        return true;
      }
    }
    return false;
  }

  /**
   * Send 0x9101 directly on an active media-port socket for the given SIM/IMEI.
   * Used as fallback when the device is not connected on the JT808 control port.
   */
  /**
   * Send 0x9101 on the active JT808-auth socket for imei (the socket the device
   * used to authenticate on port 8880, not the JT1078 data socket).
   */
  triggerVideoRequest(imei: string, serverIp: string, serverTcpPort: number, serverUdpPort: number, channel: number, dataType = 0, streamType = 0): boolean {
    for (const [, s] of this.sessions) {
      if (s.simNumber !== imei) continue;
      s.serialNo++;
      const pkt = JT808Parser.buildRealtimeVideoRequest(
        imei, s.serialNo, serverIp, serverTcpPort, serverUdpPort, channel, dataType, streamType,
      );
      s.socket.write(pkt);
      this.logger.log(`triggerVideoRequest: sent 0x9101 on media socket for ${imei} ch=${channel}`);
      return true;
    }
    return false;
  }
}
