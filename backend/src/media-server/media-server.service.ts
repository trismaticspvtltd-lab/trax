import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as net from 'net';
import { spawn, ChildProcess } from 'child_process';
import { Readable, PassThrough } from 'stream';
import { JT1078Parser, JT1078Packet, DATA_TYPE, JT1078_HEADER_LEN } from '../tcp-server/jt1078.parser';
import { VideoRecordingsService } from '../video-recordings/video-recordings.service';
import { MediaServerGateway } from './media-server.gateway';
import { S3Service } from '../s3/s3.service';

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
  frameChunks: Buffer[];        // raw H.264 Annex-B frames accumulated
  totalBytes: number;
  ffmpegProcess?: ChildProcess;
  ffmpegPipe?: PassThrough;
  mp4Chunks: Buffer[];          // ffmpeg output (MP4 bytes)
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
    };

    socket.on('data', (data) => {
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

    socket.setTimeout(60_000);
    socket.on('timeout', () => {
      this.logger.warn(`Media socket timeout: ${sessionId}`);
      socket.destroy();
    });

    this.sessions.set(sessionId, session);
  }

  private processMediaBuffer(session: ActiveMediaSession, sessionId: string) {
    while (true) {
      // Find the JT1078 magic bytes
      const magic = Buffer.from([0x30, 0x31, 0x63, 0x64]);
      const start = session.buffer.indexOf(magic);
      if (start === -1) {
        // No magic found — keep the last 3 bytes in case magic spans packets
        if (session.buffer.length > 3) {
          session.buffer = session.buffer.subarray(session.buffer.length - 3);
        }
        break;
      }

      if (start > 0) {
        session.buffer = session.buffer.subarray(start);
      }

      // We need at least a full header to read the data length
      if (session.buffer.length < JT1078_HEADER_LEN) break;

      const dataLen  = session.buffer.readUInt16BE(28);
      const totalLen = JT1078_HEADER_LEN + dataLen;

      if (session.buffer.length < totalLen) break;

      const packet = JT1078Parser.parsePacket(session.buffer);
      session.buffer = session.buffer.subarray(totalLen);

      if (packet) {
        this.handlePacket(packet, session, sessionId);
      }
    }
  }

  private handlePacket(packet: JT1078Packet, session: ActiveMediaSession, sessionId: string) {
    // First packet — identify the stream
    if (!session.simNumber) {
      session.simNumber = packet.simNumber;
      session.channel   = packet.channel;
      this.logger.log(`Stream identified: SIM=${packet.simNumber} ch=${packet.channel} PT=${JT1078Parser.payloadTypeName(packet.payloadType)}`);

      // Check if there is a pending alarm capture for this device
      const pendingCapture = this.videoRecordingsService.getPendingCapture(packet.simNumber);
      if (pendingCapture) {
        session.recordingId = pendingCapture.recordingId;
        session.recordingDurationSec = this.ALARM_DURATION_SEC;
        this.videoRecordingsService.markRecordingStarted(packet.simNumber);
        this.gateway.emitStreamEvent(packet.simNumber, packet.channel, 'started', { recordingId: session.recordingId });
        this.startRecordingTimer(session);
      } else {
        // Live preview only — no recording
        this.gateway.emitStreamEvent(packet.simNumber, packet.channel, 'live');
      }

      this.sessions.set(sessionId, session);
    }

    const isVideo    = JT1078Parser.isVideoFrame(packet);
    const isKeyFrame = JT1078Parser.isKeyFrame(packet);
    const isAudio    = JT1078Parser.isAudio(packet);

    // ── Live relay via WebSocket ──────────────────────────────────────────────
    if (isVideo) {
      const annexB = JT1078Parser.toAnnexB(packet.data);
      this.gateway.emitFrame(session.simNumber, session.channel, annexB, isKeyFrame);

      // Accumulate for recording
      if (session.recordingId !== undefined) {
        session.frameChunks.push(annexB);
        session.totalBytes += annexB.length;

        // If we have a live ffmpeg pipe, write to it
        if (session.ffmpegPipe) {
          try { session.ffmpegPipe.write(annexB); } catch { /* pipe closed */ }
        }
      }
    } else if (isAudio && session.ffmpegPipe) {
      // Pass audio to ffmpeg as well (G.711A/AAC)
      try { session.ffmpegPipe.write(packet.data); } catch { /* ignore */ }
    }
  }

  // ── Recording Timer ─────────────────────────────────────────────────────────

  private startRecordingTimer(session: ActiveMediaSession) {
    // Start ffmpeg for MP4 output (gracefully fall back to raw H.264)
    this.startFfmpegPipe(session);

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

  // ── Finalize Session (on close) ─────────────────────────────────────────────

  private finalizeSession(session: ActiveMediaSession) {
    if (session.recordingTimer) {
      clearTimeout(session.recordingTimer);
    }

    if (!session.recordingId) {
      // Live-only session, emit stopped event
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
}
