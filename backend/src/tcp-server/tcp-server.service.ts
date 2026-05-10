import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { JT808Parser, MsgId } from './jt808.parser';
import { DevicesService } from '../devices/devices.service';
import { TrackingService } from '../tracking/tracking.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { VideoRecordingsService } from '../video-recordings/video-recordings.service';

interface DeviceSession {
  socket: net.Socket;
  imei: string;
  phone: string;
  serialNo: number;
  authenticated: boolean;
  lastHeartbeat: Date;
  buffer: Buffer;
}

@Injectable()
export class TcpServerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('TcpServer');
  private server!: net.Server;
  private sessions = new Map<string, DeviceSession>();
  private heartbeatInterval!: NodeJS.Timeout;
  private readonly mediaDir = path.join(process.cwd(), 'uploads', 'multimedia');

  constructor(
    private devicesService: DevicesService,
    private trackingService: TrackingService,
    private trackingGateway: TrackingGateway,
    private videoRecordingsService: VideoRecordingsService,
  ) {
    fs.mkdirSync(this.mediaDir, { recursive: true });
  }

  onModuleInit() {
    this.startServer();
    this.startHeartbeatMonitor();
  }

  onModuleDestroy() {
    this.server?.close();
    clearInterval(this.heartbeatInterval);
  }

  private startServer() {
    const port = parseInt(process.env.TCP_PORT || '8808');
    this.server = net.createServer((socket) => this.handleConnection(socket));

    this.server.listen(port, () => {
      this.logger.log(`JT808 TCP Server listening on port ${port}`);
    });

    this.server.on('error', (err) => {
      this.logger.error(`TCP Server error: ${err.message}`);
    });
  }

  private handleConnection(socket: net.Socket) {
    const sessionId = `${socket.remoteAddress}:${socket.remotePort}`;
    this.logger.log(`Device connected: ${sessionId}`);

    const session: DeviceSession = {
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
        this.devicesService.setOffline(session.phone).catch(() => {});
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

  private processBuffer(session: DeviceSession, sessionId: string) {
    try {
      while (true) {
        const start = session.buffer.indexOf(0x7e);
        if (start === -1) { session.buffer = Buffer.alloc(0); break; }

        const end = session.buffer.indexOf(0x7e, start + 1);
        if (end === -1) break;

        const frame = session.buffer.slice(start, end + 1);
        session.buffer = session.buffer.slice(end + 1);

        let message: any;
        try {
          message = JT808Parser.parseFrame(frame);
        } catch (parseErr: any) {
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
        } else {
          this.logger.warn(`parseFrame returned null [${sessionId}]: ${frame.toString('hex')}`);
        }
      }
    } catch (err: any) {
      this.logger.error(`processBuffer crash [${sessionId}]: ${err.message}`);
    }
  }

  private async handleMessage(message: any, session: DeviceSession) {
    const { messageId, phoneNumber, serialNumber } = message;

    switch (messageId) {
      case MsgId.TERMINAL_REGISTER:        await this.handleRegistration(message, session); break;
      case MsgId.TERMINAL_AUTH:            await this.handleAuthentication(message, session); break;
      case MsgId.HEARTBEAT:                this.handleHeartbeat(message, session); break;
      case MsgId.TERMINAL_DEREGISTER:      await this.handleDeregistration(message, session); break;
      case MsgId.LOCATION_REPORT:          await this.handleLocationReport(message, session); break;
      case MsgId.LOCATION_QUERY_RESPONSE:  await this.handleLocationReport(message, session); break;
      case MsgId.LOCATION_BULK:            await this.handleBulkLocation(message, session); break;
      case MsgId.TERMINAL_PROPS_RESPONSE:  await this.handleTerminalProperties(message, session); break;
      case MsgId.TERMINAL_PARAMS_RESPONSE: this.handleTerminalParamsResponse(message, session); break;
      case MsgId.VEHICLE_CONTROL_RESPONSE: await this.handleVehicleControlResponse(message, session); break;
      case MsgId.MULTIMEDIA_EVENT:         this.handleMultimediaEvent(message, session); break;
      case MsgId.MULTIMEDIA_DATA:          await this.handleMultimediaData(message, session); break;
      case MsgId.DRIVER_IDENTITY:          await this.handleDriverIdentity(message, session); break;
      case MsgId.VIDEO_STREAM_SUBSCRIBE:
        this.logger.debug(`Video subscribe response from ${phoneNumber}`);
        break;
      case MsgId.TERMINAL_GENERAL_RESPONSE:
        this.logger.debug(`General response from ${phoneNumber} serial=${serialNumber}`);
        break;
      default:
        this.logger.debug(`Unknown 0x${messageId.toString(16).padStart(4, '0')} from ${phoneNumber}`);
        session.socket.write(
          JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, messageId, 3),
        );
    }
  }

  // ── Terminal Registration (0x0100) ──────────────────────────────────────────
  private async handleRegistration(message: any, session: DeviceSession) {
    const { messageBody, phoneNumber, serialNumber } = message;
    try {
      const regInfo = JT808Parser.parseRegistration(messageBody);
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
      session.socket.write(
        JT808Parser.buildRegistrationResponse(phoneNumber, session.serialNo, serialNumber, 0, authCode),
      );
      session.authenticated = true;
    } catch (err: any) {
      this.logger.error(`Registration error: ${err.message}`);
      session.socket.write(
        JT808Parser.buildRegistrationResponse(phoneNumber, session.serialNo, serialNumber, 1, ''),
      );
    }
  }

  // ── Terminal Authentication (0x0102) ────────────────────────────────────────
  private async handleAuthentication(message: any, session: DeviceSession) {
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

    session.socket.write(
      JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, MsgId.TERMINAL_AUTH, 0),
    );
  }

  // ── Heartbeat (0x0002) ──────────────────────────────────────────────────────
  private handleHeartbeat(message: any, session: DeviceSession) {
    const { phoneNumber, serialNumber } = message;
    session.lastHeartbeat = new Date();
    session.socket.write(
      JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, MsgId.HEARTBEAT, 0),
    );
  }

  // ── Terminal Deregistration (0x0003) ────────────────────────────────────────
  private async handleDeregistration(message: any, session: DeviceSession) {
    const { phoneNumber, serialNumber } = message;
    this.logger.log(`Device deregistered: ${phoneNumber}`);
    session.socket.write(
      JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, MsgId.TERMINAL_DEREGISTER, 0),
    );
    if (session.phone) {
      await this.devicesService.setOffline(session.phone).catch(() => {});
    }
  }

  // ── Location Report (0x0200/0x0201) ─────────────────────────────────────────
  private async handleLocationReport(message: any, session: DeviceSession) {
    const { messageId, messageBody, phoneNumber, serialNumber } = message;
    try {
      const locationData = JT808Parser.parseLocation(messageBody);
      if (locationData.gpsValid || messageId === MsgId.LOCATION_QUERY_RESPONSE) {
        await this.trackingService.processLocationUpdate(phoneNumber, {
          ...locationData,
          imei: phoneNumber,
        });
      }

      // Trigger alarm capture: 3 photos + 10-second video
      if (locationData.alarmFlags && this.hasActiveAlarm(locationData.alarmFlags)) {
        await this.triggerAlarmCapture(phoneNumber, locationData, session);
      }

      session.socket.write(
        JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, messageId, 0),
      );
    } catch (err: any) {
      this.logger.error(`Location parse error: ${err.message}`);
    }
  }

  private hasActiveAlarm(flags: any): boolean {
    return !!(
      flags.sos || flags.overSpeed || flags.collision || flags.rollover ||
      flags.powerCut || flags.fatigue || flags.vehicleTheft || flags.adasFCW ||
      flags.adasLDW || flags.adasPCW || flags.adasBSM || flags.dmsFatigue ||
      flags.dmsDistraction || flags.dmsPhone || flags.dmsSmoking
    );
  }

  private async triggerAlarmCapture(imei: string, locationData: any, session: DeviceSession) {
    // Skip if there's already a pending capture for this device
    if (this.videoRecordingsService.hasPendingCapture(imei)) return;

    const device = await this.devicesService.findByImei(imei);
    if (!device) return;

    // Determine primary alarm type for labelling
    const f = locationData.alarmFlags;
    const alarmType =
      f.sos ? 'sos' : f.collision ? 'collision' : f.rollover ? 'rollover' :
      f.adasFCW ? 'adasFCW' : f.adasLDW ? 'adasLDW' : f.adasPCW ? 'adasPCW' :
      f.adasBSM ? 'adasBSM' : f.dmsFatigue ? 'dmsFatigue' :
      f.dmsDistraction ? 'dmsDistraction' : f.dmsPhone ? 'dmsPhone' :
      f.dmsSmoking ? 'dmsSmoking' : f.powerCut ? 'powerCut' :
      f.overSpeed ? 'overSpeed' : 'alarm';

    await this.videoRecordingsService.createAlarmRecording(
      imei, device.id, device.name, alarmType,
      `Alarm: ${alarmType}`,
      { latitude: locationData.latitude, longitude: locationData.longitude, speed: locationData.speed },
    );

    // Send 3 photos, spaced 2 seconds apart
    this.sendCameraShoot(imei, 1, 0, 0, 0, 0xff, 8);
    setTimeout(() => { if (session.socket.writable) this.sendCameraShoot(imei, 1, 0, 0, 0, 0xff, 8); }, 2000);
    setTimeout(() => { if (session.socket.writable) this.sendCameraShoot(imei, 1, 0, 0, 0, 0xff, 8); }, 4000);

    // Tell device to stream video to our media server (use public/ngrok port if set)
    const mediaServerIp = process.env.MEDIA_SERVER_PUBLIC_IP || '127.0.0.1';
    const mediaPort = parseInt(process.env.MEDIA_SERVER_PUBLIC_PORT || process.env.MEDIA_SERVER_PORT || '8880');
    setTimeout(() => {
      if (session.socket.writable) {
        this.sendRealtimeVideoRequest(imei, mediaServerIp, mediaPort, mediaPort, 1, 0, 0);
      }
    }, 1000);

    this.logger.log(`Alarm capture triggered for ${imei}: type=${alarmType}`);
  }

  // ── Bulk Location Upload (0x0704) ────────────────────────────────────────────
  private async handleBulkLocation(message: any, session: DeviceSession) {
    const { messageBody, phoneNumber, serialNumber } = message;
    try {
      const count = messageBody.readUInt16BE(0);
      let offset = 3;

      for (let i = 0; i < count; i++) {
        const itemLen = messageBody.readUInt16BE(offset);
        offset += 2;
        const itemData = messageBody.slice(offset, offset + itemLen);
        offset += itemLen;

        const locationData = JT808Parser.parseLocation(itemData.slice(1));
        if (locationData.gpsValid) {
          await this.trackingService.processLocationUpdate(phoneNumber, locationData);
        }
      }
      session.socket.write(
        JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, MsgId.LOCATION_BULK, 0),
      );
    } catch (err: any) {
      this.logger.error(`Bulk location error: ${err.message}`);
    }
  }

  // ── Terminal Properties Response (0x0107) ────────────────────────────────────
  private async handleTerminalProperties(message: any, session: DeviceSession) {
    const { messageBody, phoneNumber, serialNumber } = message;
    try {
      const props = JT808Parser.parseTerminalProperties(messageBody);
      this.logger.log(`Terminal props: ${phoneNumber} - model=${props.terminalModel} fw=${props.fwVersion}`);
      await this.devicesService.updateByImei(phoneNumber, {
        model: props.terminalModel,
        protocolVersion: props.fwVersion,
      });
      this.trackingGateway.emitDeviceEvent(phoneNumber, 'terminal_properties', props);
    } catch (err: any) {
      this.logger.error(`Terminal properties error: ${err.message}`);
    }
    session.socket.write(
      JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, MsgId.TERMINAL_PROPS_RESPONSE, 0),
    );
  }

  // ── Terminal Parameters Response (0x0104) ────────────────────────────────────
  private handleTerminalParamsResponse(message: any, _session: DeviceSession) {
    const { messageBody, phoneNumber } = message;
    try {
      const parsed = JT808Parser.parseTerminalParamsResponse(messageBody);
      this.logger.log(`Terminal params from ${phoneNumber}: ${parsed.params.length} params`);
      this.trackingGateway.emitDeviceEvent(phoneNumber, 'terminal_params', parsed);
    } catch (err: any) {
      this.logger.error(`Terminal params response error: ${err.message}`);
    }
  }

  // ── Vehicle Control Response (0x0500) ────────────────────────────────────────
  private async handleVehicleControlResponse(message: any, _session: DeviceSession) {
    const { messageBody, phoneNumber } = message;
    try {
      const resp = JT808Parser.parseVehicleControlResponse(messageBody);
      this.logger.log(`Vehicle control response from ${phoneNumber}`);
      if (resp.location?.gpsValid) {
        await this.trackingService.processLocationUpdate(phoneNumber, {
          ...resp.location,
          imei: phoneNumber,
        });
      }
      this.trackingGateway.emitDeviceEvent(phoneNumber, 'vehicle_control_response', resp);
    } catch (err: any) {
      this.logger.error(`Vehicle control response error: ${err.message}`);
    }
  }

  // ── Multimedia Event (0x0800) ────────────────────────────────────────────────
  private handleMultimediaEvent(message: any, session: DeviceSession) {
    const { messageBody, phoneNumber, serialNumber } = message;
    try {
      const evt = JT808Parser.parseMultimediaEvent(messageBody);
      this.logger.log(`Multimedia event from ${phoneNumber}: id=${evt.mediaId} type=${evt.mediaType} ch=${evt.channel}`);
      this.trackingGateway.emitDeviceEvent(phoneNumber, 'multimedia_event', evt);
    } catch (err: any) {
      this.logger.error(`Multimedia event error: ${err.message}`);
    }
    session.socket.write(
      JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, MsgId.MULTIMEDIA_EVENT, 0),
    );
  }

  // ── Multimedia Data Upload (0x0801) ─────────────────────────────────────────
  private async handleMultimediaData(message: any, session: DeviceSession) {
    const { messageBody, phoneNumber } = message;
    try {
      const media = JT808Parser.parseMultimediaData(messageBody);
      const extMap: Record<number, string> = { 0: 'jpg', 1: 'tif', 2: 'mp3', 3: 'wav', 4: 'wmv' };
      const ext = extMap[media.mediaFormat] ?? 'bin';
      const filename = `${phoneNumber}_${media.mediaId}_ch${media.channel}_${Date.now()}.${ext}`;
      const filepath = path.join(this.mediaDir, filename);
      await fs.promises.writeFile(filepath, media.data);
      this.logger.log(`Media saved: ${filename} (${media.data.length} bytes)`);

      // If it's a JPEG from an alarm capture, upload to S3 and link to recording
      if (media.mediaFormat === 0 && media.mediaType === 0) {
        await this.videoRecordingsService.handleIncomingPhoto(phoneNumber, media.data, filename);
      }

      // Acknowledge with 0x8800 — no retransmit packets needed
      session.socket.write(
        JT808Parser.buildMultimediaUploadResponse(phoneNumber, session.serialNo, media.mediaId, []),
      );

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
    } catch (err: any) {
      this.logger.error(`Multimedia data error: ${err.message}`);
    }
  }

  // ── Driver Identity (0x0702) ────────────────────────────────────────────────
  private async handleDriverIdentity(message: any, session: DeviceSession) {
    const { messageBody, phoneNumber, serialNumber } = message;
    try {
      const identity = JT808Parser.parseDriverIdentity(messageBody);
      const action = identity.status === 0x01 ? 'IC inserted' : 'IC extracted';
      this.logger.log(`${action}: ${phoneNumber} - ${identity.name}`);
      if (identity.status === 0x01 && identity.name) {
        const device = await this.devicesService.findByImei(phoneNumber);
        if (device) {
          await this.devicesService.update(device.id, { driverName: identity.name }).catch(() => {});
        }
      }
      this.trackingGateway.emitDeviceEvent(phoneNumber, 'driver_identity', identity);
    } catch (err: any) {
      this.logger.error(`Driver identity error: ${err.message}`);
    }
    session.socket.write(
      JT808Parser.buildGeneralResponse(phoneNumber, session.serialNo, serialNumber, MsgId.DRIVER_IDENTITY, 0),
    );
  }

  // ── Heartbeat monitor ───────────────────────────────────────────────────────
  private startHeartbeatMonitor() {
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

  // ═══════════════════════════════════════════════════════════════════════════
  //  Public API — session info
  // ═══════════════════════════════════════════════════════════════════════════

  getConnectedDevices() {
    const devices: Array<{ phone: string; authenticated: boolean; lastHeartbeat: Date }> = [];
    for (const [, session] of this.sessions) {
      devices.push({
        phone: session.phone,
        authenticated: session.authenticated,
        lastHeartbeat: session.lastHeartbeat,
      });
    }
    return devices;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Command sending — low-level
  // ═══════════════════════════════════════════════════════════════════════════

  /** Generic body-only command builder. Prefer the named methods below. */
  sendCommand(imei: string, messageId: number, body: Buffer): boolean {
    const session = this.getSession(imei);
    if (!session) return false;
    session.serialNo++;
    session.socket.write(JT808Parser.buildFrame(messageId, session.phone, session.serialNo, body));
    return true;
  }

  private getSession(imei: string): DeviceSession | null {
    for (const [, session] of this.sessions) {
      if (session.imei === imei || session.phone === imei) return session;
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Named command methods (JT808 + JT1078)
  // ═══════════════════════════════════════════════════════════════════════════

  sendVehicleControl(imei: string, controlFlags: number): boolean {
    const s = this.getSession(imei);
    if (!s) return false;
    s.serialNo++;
    s.socket.write(JT808Parser.buildVehicleControl(s.phone, s.serialNo, controlFlags));
    return true;
  }

  sendQueryLocation(imei: string): boolean {
    const s = this.getSession(imei);
    if (!s) return false;
    s.serialNo++;
    s.socket.write(JT808Parser.buildLocationQuery(s.phone, s.serialNo));
    return true;
  }

  sendTempTracking(imei: string, interval: number, validity: number): boolean {
    const s = this.getSession(imei);
    if (!s) return false;
    s.serialNo++;
    s.socket.write(JT808Parser.buildTempTracking(s.phone, s.serialNo, interval, validity));
    return true;
  }

  sendSetParams(imei: string, params: { id: number; value: Buffer }[]): boolean {
    const s = this.getSession(imei);
    if (!s) return false;
    s.serialNo++;
    s.socket.write(JT808Parser.buildSetParams(s.phone, s.serialNo, params));
    return true;
  }

  sendQueryParams(imei: string, paramIds?: number[]): boolean {
    const s = this.getSession(imei);
    if (!s) return false;
    s.serialNo++;
    s.socket.write(JT808Parser.buildQueryParams(s.phone, s.serialNo, paramIds));
    return true;
  }

  sendTextMessage(imei: string, flags: number, text: string): boolean {
    const s = this.getSession(imei);
    if (!s) return false;
    s.serialNo++;
    s.socket.write(JT808Parser.buildTextMessage(s.phone, s.serialNo, flags, text));
    return true;
  }

  sendTerminalControl(imei: string, cmd: number, param = ''): boolean {
    const s = this.getSession(imei);
    if (!s) return false;
    s.serialNo++;
    s.socket.write(JT808Parser.buildTerminalControl(s.phone, s.serialNo, cmd, param));
    return true;
  }

  sendCameraShoot(
    imei: string,
    channel: number,
    command: number,
    interval = 0,
    savingFlag = 0,
    resolution = 0xff,
    quality = 8,
    brightness = 128,
    contrast = 128,
    saturation = 128,
    chroma = 128,
  ): boolean {
    const s = this.getSession(imei);
    if (!s) return false;
    s.serialNo++;
    s.socket.write(
      JT808Parser.buildCameraShoot(s.phone, s.serialNo, channel, command, interval, savingFlag, resolution, quality, brightness, contrast, saturation, chroma),
    );
    return true;
  }

  sendRealtimeVideoRequest(
    imei: string,
    serverIp: string,
    serverTcpPort: number,
    serverUdpPort: number,
    channel: number,
    dataType = 0,
    streamType = 0,
  ): boolean {
    const s = this.getSession(imei);
    if (!s) return false;
    s.serialNo++;
    s.socket.write(
      JT808Parser.buildRealtimeVideoRequest(s.phone, s.serialNo, serverIp, serverTcpPort, serverUdpPort, channel, dataType, streamType),
    );
    return true;
  }

  sendVideoControl(imei: string, channel: number, command: number, closeType?: number): boolean {
    const s = this.getSession(imei);
    if (!s) return false;
    s.serialNo++;
    s.socket.write(JT808Parser.buildVideoControl(s.phone, s.serialNo, channel, command, closeType));
    return true;
  }

  sendHistVideoRequest(
    imei: string,
    channel: number,
    mediaType: number,
    streamType: number,
    storageType: number,
    playbackMode: number,
    playbackSpeed: number,
    startTime: Date,
    endTime: Date,
    serverIp: string,
    serverTcpPort: number,
    serverUdpPort: number,
  ): boolean {
    const s = this.getSession(imei);
    if (!s) return false;
    s.serialNo++;
    s.socket.write(
      JT808Parser.buildHistVideoRequest(s.phone, s.serialNo, channel, mediaType, streamType, storageType, playbackMode, playbackSpeed, startTime, endTime, serverIp, serverTcpPort, serverUdpPort),
    );
    return true;
  }

  sendFileListQuery(
    imei: string,
    channel: number,
    startTime: Date,
    endTime: Date,
    alarmFlag = 0,
    mediaType = 0,
    storageType = 0,
  ): boolean {
    const s = this.getSession(imei);
    if (!s) return false;
    s.serialNo++;
    s.socket.write(
      JT808Parser.buildFileListQuery(s.phone, s.serialNo, channel, startTime, endTime, alarmFlag, mediaType, storageType),
    );
    return true;
  }

  sendFileUploadControl(
    imei: string,
    serverIp: string,
    serverTcpPort: number,
    channel: number,
    startTime: Date,
    endTime: Date,
    alarmFlag: number,
    mediaType: number,
    storageType: number,
    taskId: number,
    condition: number,
  ): boolean {
    const s = this.getSession(imei);
    if (!s) return false;
    s.serialNo++;
    s.socket.write(
      JT808Parser.buildFileUploadControl(s.phone, s.serialNo, serverIp, serverTcpPort, channel, startTime, endTime, alarmFlag, mediaType, storageType, taskId, condition),
    );
    return true;
  }

  sendPtzControl(imei: string, channel: number, speed: number, cmd: number): boolean {
    const s = this.getSession(imei);
    if (!s) return false;
    s.serialNo++;
    s.socket.write(JT808Parser.buildPtzControl(s.phone, s.serialNo, channel, speed, cmd));
    return true;
  }
}
