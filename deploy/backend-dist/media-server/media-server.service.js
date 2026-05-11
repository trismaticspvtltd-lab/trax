"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaServerService = void 0;
const common_1 = require("@nestjs/common");
const net = __importStar(require("net"));
const child_process_1 = require("child_process");
const stream_1 = require("stream");
const jt1078_parser_1 = require("../tcp-server/jt1078.parser");
const jt808_parser_1_media = require("../tcp-server/jt808.parser");
const video_recordings_service_1 = require("../video-recordings/video-recordings.service");
const media_server_gateway_1 = require("./media-server.gateway");
const s3_service_1 = require("../s3/s3.service");
let MediaServerService = class MediaServerService {
    videoRecordingsService;
    gateway;
    s3;
    logger = new common_1.Logger('MediaServer');
    server;
    sessions = new Map();
    ALARM_DURATION_SEC = 10;
    // Static callback registered by TcpServerService to auto-send 0x9101 when media auth completes
    static onVideoAuth = null;
    // Tracks IMEIs that have already received a 0x9101 command in this server session
    static sent9101 = new Map(); // phone -> timestamp
    // Call when device JT808 socket disconnects to allow fresh 0x9101 on reconnect
    static clearCommand(phone) { MediaServerService.sent9101.delete(phone); }
    constructor(videoRecordingsService, gateway, s3) {
        this.videoRecordingsService = videoRecordingsService;
        this.gateway = gateway;
        this.s3 = s3;
    }
    onModuleInit() {
        this.startMediaServer();
    }
    onModuleDestroy() {
        this.server?.close();
        for (const [, session] of this.sessions) {
            session.socket.destroy();
        }
    }
    startMediaServer() {
        const port = parseInt(process.env.MEDIA_SERVER_PORT || '8880');
        this.server = net.createServer((socket) => this.handleMediaConnection(socket));
        this.server.listen(port, () => {
            this.logger.log(`JT1078 Media Server listening on port ${port}`);
        });
        this.server.on('error', (err) => {
            this.logger.error(`Media Server error: ${err.message}`);
        });
    }
    handleMediaConnection(socket) {
        const sessionId = `${socket.remoteAddress}:${socket.remotePort}`;
        this.logger.log(`Media connection from ${sessionId}`);
        const session = {
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
            jt808Authed: false,
            jt808Phone: '',
        };
        socket.on('data', (data) => {
            this.logger.log(`RAW media [${sessionId}] auth=${session.jt808Authed} ${data.length}b: ${data.slice(0, 48).toString('hex')}`);
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
            this.logger.warn(`Media socket timeout (5min idle): ${sessionId}`);
            socket.destroy();
        });
        this.sessions.set(sessionId, session);
    }
    processMediaBuffer(session, sessionId) {
        // Device sends JT808 register/auth frames to this port before streaming JT1078 video
        if (!session.jt808Authed && session.buffer.length > 0 && session.buffer[0] === 0x7e) {
            this.handleJT808OnMediaPort(session, sessionId);
            // If still not authed (more JT808 frames needed), stop
            if (!session.jt808Authed) return;
        }
        // After auth the device can send interleaved JT808 frames AND JT1078 video frames
        // Process the buffer by detecting which protocol each chunk belongs to
        while (session.buffer.length > 0) {
            const firstByte = session.buffer[0];
            if (firstByte === 0x7e) {
                // JT808 frame after auth (location, heartbeat, responses, etc.)
                const end = session.buffer.indexOf(0x7e, 1);
                if (end === -1) break; // incomplete frame, wait for more data
                const frame = session.buffer.slice(0, end + 1);
                session.buffer = session.buffer.subarray(end + 1);
                if (frame.length >= 13) {
                    const msgId = frame.readUInt16BE(1);
                    const phone = frame.subarray(5, 11).toString('hex').replace(/^0+/, '') || '0';
                    const serial = frame.readUInt16BE(11);
                    this.logger.log(`Media JT808 post-auth msg=0x${msgId.toString(16).padStart(4,'0')} from ${phone} len=${frame.length}`);
                    session.socket.write(this.buildJT808GenResp(phone, 1, serial, msgId, 0));
                    // Device re-auths on this media socket after receiving 0x9101 via JT808 — respond with 0x9101 on THIS socket to trigger per-channel connections
                    if (msgId === 0x0102 && !session.hasRegistered) {
                        const mediaIp = process.env.MEDIA_SERVER_PUBLIC_IP || '127.0.0.1';
                        const mediaPort = parseInt(process.env.MEDIA_SERVER_PUBLIC_PORT || process.env.MEDIA_SERVER_PORT || '8880');
                        const cmd9101 = jt808_parser_1_media.JT808Parser.buildRealtimeVideoRequest(phone, 99, mediaIp, mediaPort, mediaPort, 1, 1, 0);
                        this.logger.log(`Post-auth 0x0102 from ${phone} — sending 0x9101 on media socket to trigger per-channel connections`);
                        session.socket.write(cmd9101);
                    }
                }
                continue;
            }
            // Look for JT1078 magic bytes 0x30 0x31 0x63 0x64
            const magic = Buffer.from([0x30, 0x31, 0x63, 0x64]);
            const start = session.buffer.indexOf(magic);
            if (start === -1) {
                if (session.buffer.length > 4 && !session._noMagicLogged) {
                    session._noMagicLogged = true;
                    this.logger.log(`JT1078 search: no magic in ${session.buffer.length}b from ${session.simNumber || sessionId} — hex: ${session.buffer.slice(0,16).toString('hex')}`);
                }
                // No JT1078 magic found; keep last 3 bytes in case split across packets
                if (session.buffer.length > 3) {
                    session.buffer = session.buffer.subarray(session.buffer.length - 3);
                }
                break;
            }
            if (start > 0) {
                session.buffer = session.buffer.subarray(start);
            }
            if (session.buffer.length < jt1078_parser_1.JT1078_HEADER_LEN)
                break;
            const dataLen = session.buffer.readUInt16BE(28);
            const totalLen = jt1078_parser_1.JT1078_HEADER_LEN + dataLen;
            if (session.buffer.length < totalLen)
                break;
            const packet = jt1078_parser_1.JT1078Parser.parsePacket(session.buffer);
            session.buffer = session.buffer.subarray(totalLen);
            if (packet) {
                session._pktCount = (session._pktCount || 0) + 1;
                if (session._pktCount === 1 || session._pktCount % 50 === 0) {
                    this.logger.log(`JT1078 packet #${session._pktCount} from ${session.simNumber || sessionId} ch=${packet.channel} PT=${jt1078_parser_1.JT1078Parser.payloadTypeName(packet.payloadType)} len=${totalLen}`);
                }
                this.handlePacket(packet, session, sessionId);
            }
        }
    }
    handleJT808OnMediaPort(session, sessionId) {
        const buf = session.buffer;
        let pos = 0;
        while (pos < buf.length) {
            if (buf[pos] !== 0x7e) { pos++; continue; }
            const end = buf.indexOf(0x7e, pos + 1);
            if (end === -1) break;
            const frame = buf.slice(pos, end + 1);
            pos = end + 1;
            if (frame.length >= 13) {
                const msgId = frame.readUInt16BE(1);
                const phone = frame.subarray(5, 11).toString('hex').replace(/^0+/, '') || '0';
                const serial = frame.readUInt16BE(11);
                if (!session.jt808Phone && phone) {
                    session.jt808Phone = phone;
                    session.simNumber = phone;
                }
                if (msgId === 0x0003) {
                    session.socket.write(this.buildJT808GenResp(phone, 1, serial, msgId, 0));
                } else if (msgId === 0x0100) {
                    const authCode = `AUTH_${phone.slice(-6)}`;
                    session.socket.write(this.buildJT808RegResp(phone, 1, serial, 0, authCode));
                    // Mark as registered but NOT yet authed — per-channel media connections do 0x0100+0x0102
                    session.hasRegistered = true;
                    this.logger.log(`Media port JT808 registered: ${phone}`);
                } else if (msgId === 0x0102) {
                    session.socket.write(this.buildJT808GenResp(phone, 1, serial, msgId, 0));
                    session.jt808Authed = true;
                    session.simNumber = phone;
                    if (!session.hasRegistered) {
                        // Initial media socket auth — 0x9101 is sent via JT808 control; just mark ready
                        this.logger.log(`Media socket authed for ${phone} — awaiting per-channel connections (0x9101 sent via JT808)`);
                    } else {
                        // Per-channel connection (did 0x0100+0x0102) — send 0x9101 on this socket to trigger streaming
                        const mediaIp = process.env.MEDIA_SERVER_PUBLIC_IP || '127.0.0.1';
                        const mediaPort = parseInt(process.env.MEDIA_SERVER_PUBLIC_PORT || process.env.MEDIA_SERVER_PORT || '8880');
                        const cmd9101 = jt808_parser_1_media.JT808Parser.buildRealtimeVideoRequest(phone, 99, mediaIp, mediaPort, mediaPort, 1, 1, 0);
                        this.logger.log(`Per-channel media auth from ${phone} — sending 0x9101 on per-channel media socket`);
                        session.socket.write(cmd9101);
                    }
                }
            }
        }
        session.buffer = buf.slice(pos);
    }
    buildJT808GenResp(phone, serial, refSerial, refMsgId, result) {
        const body = Buffer.alloc(5);
        body.writeUInt16BE(refSerial, 0);
        body.writeUInt16BE(refMsgId, 2);
        body[4] = result;
        return this.buildJT808Frame(0x8001, phone, serial, body);
    }
    buildJT808RegResp(phone, serial, refSerial, result, authCode) {
        const authBuf = Buffer.from(authCode, 'ascii');
        const body = Buffer.alloc(3 + authBuf.length);
        body.writeUInt16BE(refSerial, 0);
        body[2] = result;
        authBuf.copy(body, 3);
        return this.buildJT808Frame(0x8100, phone, serial, body);
    }
    buildJT808Frame(msgId, phone, serial, body) {
        const phonePadded = phone.padStart(12, '0');
        const phoneBytes = Buffer.from(phonePadded, 'hex');
        const header = Buffer.alloc(12);
        header.writeUInt16BE(msgId, 0);
        header.writeUInt16BE(body.length, 2);
        phoneBytes.copy(header, 4);
        header.writeUInt16BE(serial, 10);
        const payload = Buffer.concat([header, body]);
        let cs = 0;
        for (let i = 0; i < payload.length; i++) cs ^= payload[i];
        return Buffer.concat([Buffer.from([0x7e]), payload, Buffer.from([cs, 0x7e])]);
    }
    handlePacket(packet, session, sessionId) {
        if (!session.simNumber) {
            session.simNumber = packet.simNumber;
            session.channel = packet.channel;
            this.logger.log(`Stream identified: SIM=${packet.simNumber} ch=${packet.channel} PT=${jt1078_parser_1.JT1078Parser.payloadTypeName(packet.payloadType)}`);
            const pendingCapture = this.videoRecordingsService.getPendingCapture(packet.simNumber);
            if (pendingCapture) {
                session.recordingId = pendingCapture.recordingId;
                session.recordingDurationSec = this.ALARM_DURATION_SEC;
                this.videoRecordingsService.markRecordingStarted(packet.simNumber);
                this.gateway.emitStreamEvent(packet.simNumber, packet.channel, 'started', { recordingId: session.recordingId });
                this.startRecordingTimer(session);
            }
            else {
                this.gateway.emitStreamEvent(packet.simNumber, packet.channel, 'live');
            }
            this.sessions.set(sessionId, session);
        }
        const isVideo = jt1078_parser_1.JT1078Parser.isVideoFrame(packet);
        const isKeyFrame = jt1078_parser_1.JT1078Parser.isKeyFrame(packet);
        const isAudio = jt1078_parser_1.JT1078Parser.isAudio(packet);
        if (isVideo) {
            const annexB = jt1078_parser_1.JT1078Parser.toAnnexB(packet.data);
            this.gateway.emitFrame(session.simNumber, session.channel, annexB, isKeyFrame);
            if (session.recordingId !== undefined) {
                session.frameChunks.push(annexB);
                session.totalBytes += annexB.length;
                if (session.ffmpegPipe) {
                    try {
                        session.ffmpegPipe.write(annexB);
                    }
                    catch { }
                }
            }
        }
        else if (isAudio && session.ffmpegPipe) {
            try {
                session.ffmpegPipe.write(packet.data);
            }
            catch { }
        }
    }
    startRecordingTimer(session) {
        this.startFfmpegPipe(session);
        session.recordingTimer = setTimeout(() => {
            this.logger.log(`Recording timer expired for ${session.simNumber}`);
            session.socket.destroy();
        }, session.recordingDurationSec * 1000);
    }
    startFfmpegPipe(session) {
        try {
            const ffmpeg = (0, child_process_1.spawn)('ffmpeg', [
                '-loglevel', 'error',
                '-f', 'h264',
                '-i', 'pipe:0',
                '-c:v', 'copy',
                '-movflags', 'frag_keyframe+empty_moov+faststart',
                '-f', 'mp4',
                'pipe:1',
            ]);
            const pipe = new stream_1.PassThrough();
            pipe.pipe(ffmpeg.stdin);
            session.ffmpegPipe = pipe;
            session.ffmpegProcess = ffmpeg;
            ffmpeg.stdout.on('data', (chunk) => {
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
        }
        catch (err) {
            this.logger.warn(`Could not spawn ffmpeg: ${err.message} — will save raw H.264`);
        }
    }
    finalizeSession(session) {
        if (session.recordingTimer) {
            clearTimeout(session.recordingTimer);
        }
        if (!session.recordingId) {
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
            try {
                session.ffmpegPipe?.end();
                setTimeout(() => {
                    if (session.mp4Chunks.length > 0) {
                        const mp4 = Buffer.concat(session.mp4Chunks);
                        this.videoRecordingsService
                            .finalizeVideoRecording(session.simNumber, mp4, durationSec)
                            .catch((err) => this.logger.error(`Finalize error: ${err.message}`));
                    }
                    else {
                        this.saveRawH264(session, durationSec);
                    }
                }, 5000);
            }
            catch {
                this.saveRawH264(session, durationSec);
            }
        }
        else {
            this.saveRawH264(session, durationSec);
        }
    }
    saveRawH264(session, durationSec) {
        if (session.frameChunks.length === 0)
            return;
        const raw = Buffer.concat(session.frameChunks);
        this.videoRecordingsService
            .finalizeRawH264Recording(session.simNumber, raw, durationSec)
            .catch((err) => this.logger.error(`Raw H264 save error: ${err.message}`));
    }
    getActiveStreams() {
        const streams = [];
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
    forceStopStream(imei, channel = 1) {
        for (const [, s] of this.sessions) {
            if (s.simNumber === imei && s.channel === channel) {
                s.socket.destroy();
                return true;
            }
        }
        return false;
    }
};
exports.MediaServerService = MediaServerService;
exports.MediaServerService = MediaServerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [video_recordings_service_1.VideoRecordingsService,
        media_server_gateway_1.MediaServerGateway,
        s3_service_1.S3Service])
], MediaServerService);
//# sourceMappingURL=media-server.service.js.map