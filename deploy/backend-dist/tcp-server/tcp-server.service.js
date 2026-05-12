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
exports.TcpServerService = void 0;
const common_1 = require("@nestjs/common");
const net = __importStar(require("net"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const jt808_parser_1 = require("./jt808.parser");
const devices_service_1 = require("../devices/devices.service");
const tracking_service_1 = require("../tracking/tracking.service");
const tracking_gateway_1 = require("../tracking/tracking.gateway");
const video_recordings_service_1 = require("../video-recordings/video-recordings.service");
let TcpServerService = class TcpServerService {
    devicesService;
    trackingService;
    trackingGateway;
    videoRecordingsService;
    logger = new common_1.Logger('TcpServer');
    server;
    sessions = new Map();
    heartbeatInterval;
    mediaDir = path.join(process.cwd(), 'uploads', 'multimedia');
    constructor(devicesService, trackingService, trackingGateway, videoRecordingsService) {
        this.devicesService = devicesService;
        this.trackingService = trackingService;
        this.trackingGateway = trackingGateway;
        this.videoRecordingsService = videoRecordingsService;
        fs.mkdirSync(this.mediaDir, { recursive: true });
    }
    onModuleInit() {
        this.startServer();
        this.startHeartbeatMonitor();
        // Register auto-trigger: when device auths on media port, immediately send 0x9101
        try {
            const { MediaServerService } = require('../media-server/media-server.service');
            const mediaIp = process.env.MEDIA_SERVER_PUBLIC_IP || '127.0.0.1';
            const mediaPort = parseInt(process.env.MEDIA_SERVER_PUBLIC_PORT || process.env.MEDIA_SERVER_PORT || '8880');
            MediaServerService.onVideoAuth = (phone) => {
                this.logger.log(`Auto-sending 0x9101 to ${phone} after media auth`);
                // dataType=1 (video only), streamType=0 (main stream), channel=1
                const rawCmd = jt808_parser_1.JT808Parser.buildRealtimeVideoRequest(phone, 99, mediaIp, mediaPort, mediaPort, 1, 1, 0);
                this.logger.log(`0x9101 bytes for ${phone}: ${rawCmd.toString('hex')}`);
                const sent = this.sendRealtimeVideoRequest(phone, mediaIp, mediaPort, mediaPort, 1, 1, 0);
                this.logger.log(`Auto 0x9101 result for ${phone}: ${sent}`);
            };
        } catch (e) {
            this.logger.warn(`Could not register media auth callback: ${e.message}`);
        }
    }
    onModuleDestroy() {
        this.server?.close();
        clearInterval(this.heartbeatInterval);
    }
    startServer() {
        const port = parseInt(process.env.TCP_PORT || '8808');
        this.server = net.createServer((socket) => this.handleConnection(socket));
        this.server.listen(port, () => {
            this.logger.log(`JT808 TCP Server listening on port ${port}`);
        });
        this.server.on('error', (err) => {
            this.logger.error(`TCP Server error: ${err.message}`);
        });
    }
    handleConnection(socket) {
        const sessionId = `${socket.remoteAddress}:${socket.remotePort}`;
        this.logger.log(`Device connected: ${sessionId}`);
        const session = {
            socket,
            imei: '',
            phone: '',
            serialNo: 0,
            authenticated: false,
            lastHeartbeat: new Date(),
            buffer: Buffer.alloc(0),
        };
        this.sessions.set(sessionId, session);
        socket.on('data', (data) => {
            this.logger.log(`RAW [${sessionId}] ${data.length}b: ${data.slice(0, 64).toString('hex')}`);
            session.buffer = Buffer.concat([session.buffer, data]);
            this.processBuffer(session, sessionId);
        });
        socket.on('close', () => {
            this.logger.log(`Device disconnected: ${sessionId} (${session.phone})`);
            if (session.phone) {
                this.devicesService.setOffline(session.phone).catch(() => { });
                try {
                    const { MediaServerService } = require('../media-server/media-server.service');
                    MediaServerService.clearCommand(session.phone);
                } catch (_) {}
            }
            this.sessions.delete(sessionId);
        });
        socket.on('error', (err) => {
            this.logger.error(`Socket error [${sessionId}]: ${err.message}`);
            this.sessions.delete(sessionId);
        });
        socket.setTimeout(120000);
        socket.on('timeout', () => {
            this.logger.warn(`Socket timeout: ${sessionId}`);
            socket.destroy();
        });
    }
    processBuffer(session, sessionId) {
        try {
            while (true) {
                const start = session.buffer.indexOf(0x7e);
                if (start === -1) {
                    session.buffer = Buffer.alloc(0);
                    break;
                }
                const end = session.buffer.indexOf(0x7e, start + 1);
                if (end === -1)
                    break;
                const frame = session.buffer.slice(start, end + 1);
                session.buffer = session.buffer.slice(end + 1);
                let message;
                try {
                    message = jt808_parser_1.JT808Parser.parseFrame(frame);
                }
                catch (parseErr) {
                    this.logger.error(`Parse error [${sessionId}]: ${parseErr.message} | frame: ${frame.toString('hex')}`);
                    continue;
                }
                if (message) {
                    session.lastHeartbeat = new Date();
                    if (!session.phone) {
                        session.phone = message.phoneNumber;
                        session.imei = message.phoneNumber;
                    }
                    session.serialNo++;
                    this.handleMessage(message, session).catch((err) => {
                        this.logger.error(`Message handling error: ${err.message}`);
                    });
                }
                else {
                    this.logger.warn(`parseFrame returned null [${sessionId}]: ${frame.toString('hex')}`);
                }
            }
        }
        catch (err) {
            this.logger.error(`processBuffer crash [${sessionId}]: ${err.message}`);
        }
    }
    async handleMessage(message, session) {
        const { messageId, phoneNumber, serialNumber } = message;
        switch (messageId) {
            case jt808_parser_1.MsgId.TERMINAL_REGISTER:
                await this.handleRegistration(message, session);
                break;
            case jt808_parser_1.MsgId.TERMINAL_AUTH:
                await this.handleAuthentication(message, session);
                break;
            case jt808_parser_1.MsgId.HEARTBEAT:
                this.handleHeartbeat(message, session);
                break;
            case jt808_parser_1.MsgId.TERMINAL_DEREGISTER:
                await this.handleDeregistration(message, session);
                break;
            case jt808_parser_1.MsgId.LOCATION_REPORT:
                await this.handleLocationReport(message, session);
                break;
            case jt808_parser_1.MsgId.LOCATION_QUERY_RESPONSE:
                await this.handleLocationReport(message, session);
                break;
            case jt808_parser_1.MsgId.LOCATION_BULK:
                await this.handleBulkLocation(message, session);
                break;
            case jt808_parser_1.MsgId.TERMINAL_PROPS_RESPONSE:
                await this.handleTerminalProperties(message, session);
                break;
            case jt808_parser_1.MsgId.TERMINAL_PARAMS_RESPONSE:
                this.handleTerminalParamsResponse(message, session);
                break;
            case jt808_parser_1.MsgId.VEHICLE_CONTROL_RESPONSE:
                await this.handleVehicleControlResponse(message, session);
                break;
            case jt808_parser_1.MsgId.MULTIMEDIA_EVENT:
                this.handleMultimediaEvent(message, session);
                break;
            case jt808_parser_1.MsgId.MULTIMEDIA_DATA:
                await this.handleMultimediaData(message, session);
                break;
            case jt808_parser_1.MsgId.DRIVER_IDENTITY:
                await this.handleDriverIdentity(message, session);
                break;
            case jt808_parser_1.MsgId.VIDEO_STREAM_SUBSCRIBE:
                this.logger.debug(`Video subscribe response from ${phoneNumber}`);
                break;
            case jt808_parser_1.MsgId.TERMINAL_GENERAL_RESPONSE:
                this.logger.log(`General response (0x0001) from ${phoneNumber} serial=${serialNumber}`);
                break;
            default:
                this.logger.debug(`Unknown 0x${messageId.toString(16).padStart(4, '0')} from ${phoneNumber}`);
                session.socket.write(jt808_parser_1.JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, messageId, 3));
        }
    }
    async handleRegistration(message, session) {
        const { messageBody, phoneNumber, serialNumber } = message;
        try {
            const regInfo = jt808_parser_1.JT808Parser.parseRegistration(messageBody);
            this.logger.log(`Device registered: ${phoneNumber} - ${regInfo.plateNumber}`);
            let device = await this.devicesService.findByImei(phoneNumber);
            if (!device) {
                device = await this.devicesService.create({
                    imei: phoneNumber,
                    name: regInfo.plateNumber || `Device ${phoneNumber}`,
                    plateNumber: regInfo.plateNumber,
                    model: regInfo.terminalModel,
                    isActive: true,
                });
            }
            const authCode = `AUTH_${phoneNumber.slice(-6)}`;
            session.socket.write(jt808_parser_1.JT808Parser.buildRegistrationResponse(phoneNumber, session.serialNo, serialNumber, 0, authCode));
            session.authenticated = true;
            session.hasRegistered = true; // Per-channel connections do 0x0100 first
        }
        catch (err) {
            this.logger.error(`Registration error: ${err.message}`);
            session.socket.write(jt808_parser_1.JT808Parser.buildRegistrationResponse(phoneNumber, session.serialNo, serialNumber, 1, ''));
        }
    }
    async handleAuthentication(message, session) {
        const { phoneNumber, serialNumber } = message;
        this.logger.log(`Device authenticated: ${phoneNumber}`);
        session.authenticated = true;
        let device = await this.devicesService.findByImei(phoneNumber);
        if (!device) {
            device = await this.devicesService.create({
                imei: phoneNumber,
                name: `Device ${phoneNumber}`,
                isActive: true,
            });
        }
        session.socket.write(jt808_parser_1.JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, jt808_parser_1.MsgId.TERMINAL_AUTH, 0));
        if (!session.hasRegistered) {
            // Main connection (no prior 0x0100) — auto-send 0x9101 so device opens media connections
            const mediaIp = process.env.MEDIA_SERVER_PUBLIC_IP || '127.0.0.1';
            const mediaPort = parseInt(process.env.MEDIA_SERVER_PUBLIC_PORT || process.env.MEDIA_SERVER_PORT || '8880');
            setTimeout(() => {
                if (session.socket.writable) {
                    this.logger.log(`Auto 0x9101 after JT808 auth for ${phoneNumber}`);
                    session.serialNo++;
                    session.socket.write(jt808_parser_1.JT808Parser.buildRealtimeVideoRequest(session.phone, session.serialNo, mediaIp, mediaPort, mediaPort, 1, 0, 0));
                }
            }, 800);
        } else {
            // Per-channel connection (did 0x0100+0x0102) — send 0x9101 on this socket to trigger streaming
            const mediaIp = process.env.MEDIA_SERVER_PUBLIC_IP || '127.0.0.1';
            const mediaPort = parseInt(process.env.MEDIA_SERVER_PUBLIC_PORT || process.env.MEDIA_SERVER_PORT || '8880');
            this.logger.log(`Per-channel JT808 auth for ${phoneNumber} — sending 0x9101 on per-channel socket`);
            session.serialNo++;
            session.socket.write(jt808_parser_1.JT808Parser.buildRealtimeVideoRequest(session.phone, session.serialNo, mediaIp, mediaPort, mediaPort, 1, 0, 0));
        }
    }
    handleHeartbeat(message, session) {
        const { phoneNumber, serialNumber } = message;
        session.lastHeartbeat = new Date();
        session.socket.write(jt808_parser_1.JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, jt808_parser_1.MsgId.HEARTBEAT, 0));
    }
    async handleDeregistration(message, session) {
        const { phoneNumber, serialNumber } = message;
        this.logger.log(`Device deregistered: ${phoneNumber}`);
        session.socket.write(jt808_parser_1.JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, jt808_parser_1.MsgId.TERMINAL_DEREGISTER, 0));
        if (session.phone) {
            await this.devicesService.setOffline(session.phone).catch(() => { });
        }
    }
    async handleLocationReport(message, session) {
        const { messageId, messageBody, phoneNumber, serialNumber } = message;
        try {
            const locationData = jt808_parser_1.JT808Parser.parseLocation(messageBody);
            if (locationData.gpsValid || messageId === jt808_parser_1.MsgId.LOCATION_QUERY_RESPONSE) {
                await this.trackingService.processLocationUpdate(phoneNumber, {
                    ...locationData,
                    imei: phoneNumber,
                });
            }
            if (locationData.alarmFlags && this.hasActiveAlarm(locationData.alarmFlags)) {
                await this.triggerAlarmCapture(phoneNumber, locationData, session);
            }
            session.socket.write(jt808_parser_1.JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, messageId, 0));
        }
        catch (err) {
            this.logger.error(`Location parse error: ${err.message}`);
        }
    }
    hasActiveAlarm(flags) {
        return !!(flags.sos || flags.overSpeed || flags.collision || flags.rollover ||
            flags.powerCut || flags.fatigue || flags.vehicleTheft || flags.adasFCW ||
            flags.adasLDW || flags.adasPCW || flags.adasBSM || flags.dmsFatigue ||
            flags.dmsDistraction || flags.dmsPhone || flags.dmsSmoking);
    }
    async triggerAlarmCapture(imei, locationData, session) {
        if (this.videoRecordingsService.hasPendingCapture(imei))
            return;
        const device = await this.devicesService.findByImei(imei);
        if (!device)
            return;
        const f = locationData.alarmFlags;
        const alarmType = f.sos ? 'sos' : f.collision ? 'collision' : f.rollover ? 'rollover' :
            f.adasFCW ? 'adasFCW' : f.adasLDW ? 'adasLDW' : f.adasPCW ? 'adasPCW' :
                f.adasBSM ? 'adasBSM' : f.dmsFatigue ? 'dmsFatigue' :
                    f.dmsDistraction ? 'dmsDistraction' : f.dmsPhone ? 'dmsPhone' :
                        f.dmsSmoking ? 'dmsSmoking' : f.powerCut ? 'powerCut' :
                            f.overSpeed ? 'overSpeed' : 'alarm';
        await this.videoRecordingsService.createAlarmRecording(imei, device.id, device.name, alarmType, `Alarm: ${alarmType}`, { latitude: locationData.latitude, longitude: locationData.longitude, speed: locationData.speed });
        this.sendCameraShoot(imei, 1, 0, 0, 0, 0xff, 8);
        setTimeout(() => { if (session.socket.writable)
            this.sendCameraShoot(imei, 1, 0, 0, 0, 0xff, 8); }, 2000);
        setTimeout(() => { if (session.socket.writable)
            this.sendCameraShoot(imei, 1, 0, 0, 0, 0xff, 8); }, 4000);
        const mediaServerIp = process.env.MEDIA_SERVER_PUBLIC_IP || '127.0.0.1';
        const mediaPort = parseInt(process.env.MEDIA_SERVER_PUBLIC_PORT || process.env.MEDIA_SERVER_PORT || '8880');
        setTimeout(() => {
            if (session.socket.writable) {
                this.sendRealtimeVideoRequest(imei, mediaServerIp, mediaPort, mediaPort, 1, 0, 0);
            }
        }, 1000);
        this.logger.log(`Alarm capture triggered for ${imei}: type=${alarmType}`);
    }
    async handleBulkLocation(message, session) {
        const { messageBody, phoneNumber, serialNumber } = message;
        try {
            const count = messageBody.readUInt16BE(0);
            let offset = 3;
            for (let i = 0; i < count; i++) {
                const itemLen = messageBody.readUInt16BE(offset);
                offset += 2;
                const itemData = messageBody.slice(offset, offset + itemLen);
                offset += itemLen;
                const locationData = jt808_parser_1.JT808Parser.parseLocation(itemData);
                if (locationData.gpsValid) {
                    await this.trackingService.processLocationUpdate(phoneNumber, locationData);
                }
            }
            session.socket.write(jt808_parser_1.JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, jt808_parser_1.MsgId.LOCATION_BULK, 0));
        }
        catch (err) {
            this.logger.error(`Bulk location error: ${err.message}`);
        }
    }
    async handleTerminalProperties(message, session) {
        const { messageBody, phoneNumber, serialNumber } = message;
        try {
            const props = jt808_parser_1.JT808Parser.parseTerminalProperties(messageBody);
            this.logger.log(`Terminal props: ${phoneNumber} - model=${props.terminalModel} fw=${props.fwVersion}`);
            await this.devicesService.updateByImei(phoneNumber, {
                model: props.terminalModel,
                protocolVersion: props.fwVersion,
            });
            this.trackingGateway.emitDeviceEvent(phoneNumber, 'terminal_properties', props);
        }
        catch (err) {
            this.logger.error(`Terminal properties error: ${err.message}`);
        }
        session.socket.write(jt808_parser_1.JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, jt808_parser_1.MsgId.TERMINAL_PROPS_RESPONSE, 0));
    }
    handleTerminalParamsResponse(message, _session) {
        const { messageBody, phoneNumber } = message;
        try {
            const parsed = jt808_parser_1.JT808Parser.parseTerminalParamsResponse(messageBody);
            this.logger.log(`Terminal params from ${phoneNumber}: ${parsed.params.length} params`);
            this.trackingGateway.emitDeviceEvent(phoneNumber, 'terminal_params', parsed);
        }
        catch (err) {
            this.logger.error(`Terminal params response error: ${err.message}`);
        }
    }
    async handleVehicleControlResponse(message, _session) {
        const { messageBody, phoneNumber } = message;
        try {
            const resp = jt808_parser_1.JT808Parser.parseVehicleControlResponse(messageBody);
            this.logger.log(`Vehicle control response from ${phoneNumber}`);
            if (resp.location?.gpsValid) {
                await this.trackingService.processLocationUpdate(phoneNumber, {
                    ...resp.location,
                    imei: phoneNumber,
                });
            }
            this.trackingGateway.emitDeviceEvent(phoneNumber, 'vehicle_control_response', resp);
        }
        catch (err) {
            this.logger.error(`Vehicle control response error: ${err.message}`);
        }
    }
    handleMultimediaEvent(message, session) {
        const { messageBody, phoneNumber, serialNumber } = message;
        try {
            const evt = jt808_parser_1.JT808Parser.parseMultimediaEvent(messageBody);
            this.logger.log(`Multimedia event from ${phoneNumber}: id=${evt.mediaId} type=${evt.mediaType} ch=${evt.channel}`);
            this.trackingGateway.emitDeviceEvent(phoneNumber, 'multimedia_event', evt);
        }
        catch (err) {
            this.logger.error(`Multimedia event error: ${err.message}`);
        }
        session.socket.write(jt808_parser_1.JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, jt808_parser_1.MsgId.MULTIMEDIA_EVENT, 0));
    }
    async handleMultimediaData(message, session) {
        const { messageBody, phoneNumber } = message;
        try {
            const media = jt808_parser_1.JT808Parser.parseMultimediaData(messageBody);
            const extMap = { 0: 'jpg', 1: 'tif', 2: 'mp3', 3: 'wav', 4: 'wmv' };
            const ext = extMap[media.mediaFormat] ?? 'bin';
            const filename = `${phoneNumber}_${media.mediaId}_ch${media.channel}_${Date.now()}.${ext}`;
            const filepath = path.join(this.mediaDir, filename);
            await fs.promises.writeFile(filepath, media.data);
            this.logger.log(`Media saved: ${filename} (${media.data.length} bytes)`);
            if (media.mediaFormat === 0 && media.mediaType === 0) {
                await this.videoRecordingsService.handleIncomingPhoto(phoneNumber, media.data, filename);
            }
            session.socket.write(jt808_parser_1.JT808Parser.buildMultimediaUploadResponse(phoneNumber, session.serialNo, media.mediaId, []));
            this.trackingGateway.emitDeviceEvent(phoneNumber, 'multimedia_data', {
                mediaId: media.mediaId,
                mediaType: media.mediaType,
                mediaFormat: media.mediaFormat,
                channel: media.channel,
                filename,
                url: `/uploads/multimedia/${filename}`,
                size: media.data.length,
                location: media.location,
            });
        }
        catch (err) {
            this.logger.error(`Multimedia data error: ${err.message}`);
        }
    }
    async handleDriverIdentity(message, session) {
        const { messageBody, phoneNumber, serialNumber } = message;
        try {
            const identity = jt808_parser_1.JT808Parser.parseDriverIdentity(messageBody);
            const action = identity.status === 0x01 ? 'IC inserted' : 'IC extracted';
            this.logger.log(`${action}: ${phoneNumber} - ${identity.name}`);
            if (identity.status === 0x01 && identity.name) {
                const device = await this.devicesService.findByImei(phoneNumber);
                if (device) {
                    await this.devicesService.update(device.id, { driverName: identity.name }).catch(() => { });
                }
            }
            this.trackingGateway.emitDeviceEvent(phoneNumber, 'driver_identity', identity);
        }
        catch (err) {
            this.logger.error(`Driver identity error: ${err.message}`);
        }
        session.socket.write(jt808_parser_1.JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, jt808_parser_1.MsgId.DRIVER_IDENTITY, 0));
    }
    startHeartbeatMonitor() {
        this.heartbeatInterval = setInterval(() => {
            const now = new Date();
            for (const [sessionId, session] of this.sessions) {
                const diff = now.getTime() - session.lastHeartbeat.getTime();
                if (diff > 180000) {
                    this.logger.warn(`No heartbeat from ${session.phone}, disconnecting`);
                    session.socket.destroy();
                    this.sessions.delete(sessionId);
                }
            }
        }, 60000);
    }
    getConnectedDevices() {
        const devices = [];
        for (const [, session] of this.sessions) {
            devices.push({
                phone: session.phone,
                authenticated: session.authenticated,
                lastHeartbeat: session.lastHeartbeat,
            });
        }
        return devices;
    }
    sendCommand(imei, messageId, body) {
        const session = this.getSession(imei);
        if (!session)
            return false;
        session.serialNo++;
        session.socket.write(jt808_parser_1.JT808Parser.buildFrame(messageId, session.phone, session.serialNo, body));
        return true;
    }
    getSession(imei) {
        for (const [, session] of this.sessions) {
            if (session.imei === imei || session.phone === imei)
                return session;
        }
        return null;
    }
    sendVehicleControl(imei, controlFlags) {
        const s = this.getSession(imei);
        if (!s)
            return false;
        s.serialNo++;
        s.socket.write(jt808_parser_1.JT808Parser.buildVehicleControl(s.phone, s.serialNo, controlFlags));
        return true;
    }
    sendQueryLocation(imei) {
        const s = this.getSession(imei);
        if (!s)
            return false;
        s.serialNo++;
        s.socket.write(jt808_parser_1.JT808Parser.buildLocationQuery(s.phone, s.serialNo));
        return true;
    }
    sendTempTracking(imei, interval, validity) {
        const s = this.getSession(imei);
        if (!s)
            return false;
        s.serialNo++;
        s.socket.write(jt808_parser_1.JT808Parser.buildTempTracking(s.phone, s.serialNo, interval, validity));
        return true;
    }
    sendSetParams(imei, params) {
        const s = this.getSession(imei);
        if (!s)
            return false;
        s.serialNo++;
        s.socket.write(jt808_parser_1.JT808Parser.buildSetParams(s.phone, s.serialNo, params));
        return true;
    }
    sendQueryParams(imei, paramIds) {
        const s = this.getSession(imei);
        if (!s)
            return false;
        s.serialNo++;
        s.socket.write(jt808_parser_1.JT808Parser.buildQueryParams(s.phone, s.serialNo, paramIds));
        return true;
    }
    sendTextMessage(imei, flags, text) {
        const s = this.getSession(imei);
        if (!s)
            return false;
        s.serialNo++;
        s.socket.write(jt808_parser_1.JT808Parser.buildTextMessage(s.phone, s.serialNo, flags, text));
        return true;
    }
    sendTerminalControl(imei, cmd, param = '') {
        const s = this.getSession(imei);
        if (!s)
            return false;
        s.serialNo++;
        s.socket.write(jt808_parser_1.JT808Parser.buildTerminalControl(s.phone, s.serialNo, cmd, param));
        return true;
    }
    sendCameraShoot(imei, channel, command, interval = 0, savingFlag = 0, resolution = 0xff, quality = 8, brightness = 128, contrast = 128, saturation = 128, chroma = 128) {
        const s = this.getSession(imei);
        if (!s)
            return false;
        s.serialNo++;
        s.socket.write(jt808_parser_1.JT808Parser.buildCameraShoot(s.phone, s.serialNo, channel, command, interval, savingFlag, resolution, quality, brightness, contrast, saturation, chroma));
        return true;
    }
    sendRealtimeVideoRequest(imei, serverIp, serverTcpPort, serverUdpPort, channel, dataType = 0, streamType = 0) {
        const s = this.getSession(imei);
        if (!s)
            return false;
        s.serialNo++;
        s.socket.write(jt808_parser_1.JT808Parser.buildRealtimeVideoRequest(s.phone, s.serialNo, serverIp, serverTcpPort, serverUdpPort, channel, dataType, streamType));
        return true;
    }
    sendVideoControl(imei, channel, command, closeType) {
        const s = this.getSession(imei);
        if (!s)
            return false;
        s.serialNo++;
        s.socket.write(jt808_parser_1.JT808Parser.buildVideoControl(s.phone, s.serialNo, channel, command, closeType));
        return true;
    }
    sendHistVideoRequest(imei, channel, mediaType, streamType, storageType, playbackMode, playbackSpeed, startTime, endTime, serverIp, serverTcpPort, serverUdpPort) {
        const s = this.getSession(imei);
        if (!s)
            return false;
        s.serialNo++;
        s.socket.write(jt808_parser_1.JT808Parser.buildHistVideoRequest(s.phone, s.serialNo, channel, mediaType, streamType, storageType, playbackMode, playbackSpeed, startTime, endTime, serverIp, serverTcpPort, serverUdpPort));
        return true;
    }
    sendFileListQuery(imei, channel, startTime, endTime, alarmFlag = 0, mediaType = 0, storageType = 0) {
        const s = this.getSession(imei);
        if (!s)
            return false;
        s.serialNo++;
        s.socket.write(jt808_parser_1.JT808Parser.buildFileListQuery(s.phone, s.serialNo, channel, startTime, endTime, alarmFlag, mediaType, storageType));
        return true;
    }
    sendFileUploadControl(imei, serverIp, serverTcpPort, channel, startTime, endTime, alarmFlag, mediaType, storageType, taskId, condition) {
        const s = this.getSession(imei);
        if (!s)
            return false;
        s.serialNo++;
        s.socket.write(jt808_parser_1.JT808Parser.buildFileUploadControl(s.phone, s.serialNo, serverIp, serverTcpPort, channel, startTime, endTime, alarmFlag, mediaType, storageType, taskId, condition));
        return true;
    }
    sendPtzControl(imei, channel, speed, cmd) {
        const s = this.getSession(imei);
        if (!s)
            return false;
        s.serialNo++;
        s.socket.write(jt808_parser_1.JT808Parser.buildPtzControl(s.phone, s.serialNo, channel, speed, cmd));
        return true;
    }
};
exports.TcpServerService = TcpServerService;
exports.TcpServerService = TcpServerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [devices_service_1.DevicesService,
        tracking_service_1.TrackingService,
        tracking_gateway_1.TrackingGateway,
        video_recordings_service_1.VideoRecordingsService])
], TcpServerService);
//# sourceMappingURL=tcp-server.service.js.map