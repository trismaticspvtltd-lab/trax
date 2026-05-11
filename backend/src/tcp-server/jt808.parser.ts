// JT/T 808-2011 (2013 revision) + JT/T 1078-2016 Protocol Parser
// Covers full message set including ADAS/DMS alarm extensions for T98 device

export interface JT808Message {
  messageId: number;
  messageBody: Buffer;
  phoneNumber: string;
  serialNumber: number;
  encryptionType: number;
  isMultiPacket: boolean;
  totalPackets?: number;
  packetNumber?: number;
}

// ─── Alarm Flags (32-bit word, JT808-2013 §28, Table 4) ───────────────────────
export interface AlarmFlags {
  // Bits 0-8: Standard alarms
  sos?: boolean;               // Bit 0
  overSpeed?: boolean;         // Bit 1
  fatigue?: boolean;           // Bit 2
  danger?: boolean;            // Bit 3
  gnssFault?: boolean;         // Bit 4
  gnssAntennaDisconnect?: boolean; // Bit 5
  gnssAntennaShorting?: boolean;   // Bit 6
  lowPower?: boolean;          // Bit 7
  powerCut?: boolean;          // Bit 8
  // Bits 9-15: Vehicle/door alarms
  vehicleTheft?: boolean;      // Bit 9
  illegalIgnition?: boolean;   // Bit 10
  illegalDisplacement?: boolean; // Bit 11
  collision?: boolean;         // Bit 12
  rollover?: boolean;          // Bit 13
  illegalDoorOpen?: boolean;   // Bit 14
  vssFault?: boolean;          // Bit 15
  // Bits 16-23: Route/driving
  dayOverSpeed?: boolean;      // Bit 16 - section overspeed warning
  nightOverSpeed?: boolean;    // Bit 17 - section overspeed alarm
  routeDeviation?: boolean;    // Bit 18
  routeSectionTimeLow?: boolean; // Bit 19
  routeSectionTimeHigh?: boolean; // Bit 20
  routeTransportTimeout?: boolean; // Bit 21
  vehicleFuelAbnormal?: boolean; // Bit 22
  vehicleRadioFault?: boolean;  // Bit 23
  // Bits 24-31: ADAS/DMS (JT1078 extensions)
  adasFCW?: boolean;           // Bit 24 - Forward Collision Warning
  adasLDW?: boolean;           // Bit 25 - Lane Departure Warning
  adasPCW?: boolean;           // Bit 26 - Pedestrian Collision Warning
  adasBSM?: boolean;           // Bit 27 - Blind Spot Monitoring
  dmsFatigue?: boolean;        // Bit 28 - Driver Fatigue (DMS)
  dmsDistraction?: boolean;    // Bit 29 - Driver Distraction (DMS)
  dmsPhone?: boolean;          // Bit 30 - Phone Use (DMS)
  dmsSmoking?: boolean;        // Bit 31 - Smoking (DMS)
}

// ─── Status Flags (32-bit word, JT808-2013 §28, Table 5) ──────────────────────
export interface StatusFlags {
  accOn?: boolean;             // Bit 0 - ACC status
  located?: boolean;           // Bit 1 - GPS fix
  latitude?: 'north' | 'south'; // Bit 2
  longitude?: 'east' | 'west';  // Bit 3
  inOperation?: boolean;       // Bit 4 - operational
  encrypted?: boolean;         // Bit 5
  loadBit?: number;            // Bits 6-7 - load status (00=empty,01=half,10=reserved,11=full)
  oilRouteOn?: boolean;        // Bit 10 - oil route on
  circuitOn?: boolean;         // Bit 11 - circuit on
  doorLocked?: boolean;        // Bit 12 - door locked
  door1Open?: boolean;         // Bit 13 - front door
  door2Open?: boolean;         // Bit 14 - middle door
  door3Open?: boolean;         // Bit 15 - rear door
  door4Open?: boolean;         // Bit 16 - driver door
  door5Open?: boolean;         // Bit 17
  gpsUsed?: boolean;           // Bit 18
  bdsUsed?: boolean;           // Bit 19 - BeiDou
  glonassUsed?: boolean;       // Bit 20
  galileoUsed?: boolean;       // Bit 21
}

// ─── Location Data ─────────────────────────────────────────────────────────────
export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  timestamp: Date;
  alarmFlags: AlarmFlags;
  statusFlags: StatusFlags;
  // Supplementary items
  mileage?: number;            // 0x01 km
  fuelLevel?: number;          // 0x02 %
  speedFromOBD?: number;       // 0x03 km/h
  engineRpm?: number;          // 0x04 rpm
  engineWaterTemp?: number;    // 0x05 °C
  fuelConsumption?: number;    // 0x06 L/100km
  recordSpeed?: number;        // 0x07 km/h
  alarmEventId?: number;       // 0x08
  tiresInfo?: Buffer;          // 0x09
  overdraftAlarm?: number;     // 0x0A (%)
  satellites?: number;         // 0x30 count
  signalStrength?: number;     // 0x31 dBm
  gnssPositionCount?: number;  // 0x32
  gnssSpeed?: number;          // 0x33 km/h
  customInfo?: Buffer;         // 0xE0-0xFF
  // ADAS/DMS from supplementary items
  adasAlert?: AdasAlert;       // 0x64
  dmsAlert?: DmsAlert;         // 0x65
  engineOn: boolean;
  gpsValid: boolean;
}

// ─── ADAS Alert (JT1078 extension item 0x64) ──────────────────────────────────
export interface AdasAlert {
  alarmId: number;
  flagState: number;           // 0=start, 1=end
  alarmType: number;           // 0=FCW,1=LDW,2=HMWW,3=PCW,4=BSM,5=TSR,6=RoadSign,7=NoLane
  speed?: number;
  cameraChannels?: number;
  videoDuration?: number;
  picCount?: number;
}

// ─── DMS Alert (JT1078 extension item 0x65) ───────────────────────────────────
export interface DmsAlert {
  alarmId: number;
  flagState: number;
  alarmType: number;           // 0=Fatigue,1=Distraction,2=Phone,3=Smoking,4=NoDriver,5=Infrared
  speed?: number;
  cameraChannels?: number;
  videoDuration?: number;
  picCount?: number;
}

// ─── Terminal Properties ───────────────────────────────────────────────────────
export interface TerminalProperties {
  terminalType: number;
  manufacturer: string;
  terminalModel: string;
  terminalId: string;
  simIccid: string;
  hwVersion: string;
  fwVersion: string;
  gnssModuleAttr: number;
  commModuleAttr: number;
}

// ─── Multimedia Event ──────────────────────────────────────────────────────────
export interface MultimediaEvent {
  mediaId: number;
  mediaType: number;           // 0=image,1=audio,2=video
  channel: number;
  event: number;               // 0=platform command,1=timing,2=robbery,3=traffic,4=parking
  location: LocationData | null;
}

// ─── Multimedia Data ───────────────────────────────────────────────────────────
export interface MultimediaData {
  mediaId: number;
  mediaType: number;
  mediaFormat: number;         // 0=JPEG,1=TIF,2=MP3,3=WAV,4=WMV
  event: number;
  channel: number;
  location: LocationData | null;
  data: Buffer;
  isComplete: boolean;
  totalPackets?: number;
  packetSeq?: number;
}

// ─── Vehicle Control Response ─────────────────────────────────────────────────
export interface VehicleControlResponse {
  serialNumber: number;
  location: LocationData | null;
}

// ─── Terminal Parameters ──────────────────────────────────────────────────────
export interface TerminalParam {
  id: number;
  value: Buffer;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  JT808 Message IDs
// ═══════════════════════════════════════════════════════════════════════════════
export enum MsgId {
  // Terminal → Platform
  TERMINAL_GENERAL_RESPONSE    = 0x0001,
  HEARTBEAT                    = 0x0002,
  TERMINAL_DEREGISTER          = 0x0003,
  TERMINAL_REGISTER            = 0x0100,
  TERMINAL_PARAMS_RESPONSE     = 0x0104,
  TERMINAL_PROPS_RESPONSE      = 0x0107,
  UPGRADE_RESULT               = 0x0108,
  TERMINAL_AUTH                = 0x0102,
  LOCATION_REPORT              = 0x0200,
  LOCATION_QUERY_RESPONSE      = 0x0201,
  LOCATION_BULK                = 0x0704,
  EVENT_REPORT                 = 0x0301,
  QUESTION_ANSWER              = 0x0302,
  INFO_ON_DEMAND               = 0x0303,
  DRIVER_IDENTITY              = 0x0702,
  TACHOGRAPH_DATA              = 0x0700,
  ELEC_WAYBILL                 = 0x0701,
  CAN_BUS_DATA                 = 0x0705,
  MULTIMEDIA_EVENT             = 0x0800,
  MULTIMEDIA_DATA              = 0x0801,
  MULTIMEDIA_SEARCH_RESPONSE   = 0x0802,
  VEHICLE_CONTROL_RESPONSE     = 0x0500,
  RSA_KEY                      = 0x0A00,
  // JT1078 Terminal → Platform
  VIDEO_STREAM_SUBSCRIBE       = 0x1005,
  HISTORICAL_STREAM_CONTROL    = 0x1206,
  FILE_UPLOAD_COMPLETE         = 0x1205,
  ALARM_ATTACH_UPLOAD          = 0x1210,
  CAMERA_SHOOT_RESPONSE        = 0x1206,

  // Platform → Terminal
  PLATFORM_GENERAL_RESPONSE    = 0x8001,
  RESEND_PACKET                = 0x8003,
  TERMINAL_REGISTER_RESPONSE   = 0x8100,
  SET_TERMINAL_PARAMS          = 0x8103,
  QUERY_TERMINAL_PARAMS        = 0x8104,
  TERMINAL_CONTROL             = 0x8105,
  UPGRADE_PACKAGE              = 0x8108,
  QUERY_LOCATION               = 0x8201,
  TEMP_LOCATION_TRACKING       = 0x8202,
  TEXT_MESSAGE                 = 0x8300,
  SET_EVENTS                   = 0x8301,
  ISSUE_QUESTION               = 0x8302,
  INFO_MENU_SETTING            = 0x8303,
  CALL_BACK                    = 0x8400,
  SET_PHONEBOOK                = 0x8401,
  VEHICLE_CONTROL              = 0x8500,
  SET_CIRCLE_AREA              = 0x8600,
  DELETE_CIRCLE_AREA           = 0x8601,
  SET_RECT_AREA                = 0x8602,
  DELETE_RECT_AREA             = 0x8603,
  SET_POLYGON_AREA             = 0x8604,
  DELETE_POLYGON_AREA          = 0x8605,
  SET_ROUTE                    = 0x8606,
  DELETE_ROUTE                 = 0x8607,
  QUERY_LOCATION_AREA_ROUTE    = 0x8608,
  DRIVING_RECORD_DATA_COLLECT  = 0x8700,
  MULTIMEDIA_UPLOAD_RESPONSE   = 0x8800,
  CAMERA_SHOOT                 = 0x8801,
  MULTIMEDIA_SEARCH            = 0x8802,
  RECORDING                    = 0x8804,
  MULTIMEDIA_SINGLE_UPLOAD     = 0x8805,
  RSA_PUBKEY                   = 0x8A00,
  // JT1078 Platform → Terminal
  REALTIME_VIDEO_REQUEST       = 0x9101,
  REALTIME_VIDEO_CONTROL       = 0x9102,
  REALTIME_VIDEO_SWITCH        = 0x9103,
  HIST_VIDEO_PLAYBACK_REQ      = 0x9201,
  HIST_VIDEO_PLAYBACK_CTRL     = 0x9202,
  FILE_LIST_QUERY              = 0x9205,
  FILE_UPLOAD_CONTROL          = 0x9206,
  PUSH_VEHICLE_ALARM           = 0x9208,
  PTZ_CONTROL                  = 0x9301,
  CAMERA_PARAM_QUERY           = 0x9302,
  CAMERA_PARAM_RESPONSE        = 0x9303,
  CAMERA_RECORD_CONTROL        = 0x9304,
  STORAGE_MEDIA_QUERY          = 0x9305,
  STORAGE_MEDIA_QUERY_RESPONSE = 0x9306,
}

// ─── Terminal Parameter IDs ────────────────────────────────────────────────────
export enum ParamId {
  HEARTBEAT_INTERVAL      = 0x0001, // seconds
  TCP_RESPONSE_TIMEOUT    = 0x0002, // seconds
  TCP_RESEND_COUNT        = 0x0003,
  UDP_RESPONSE_TIMEOUT    = 0x0004,
  UDP_RESEND_COUNT        = 0x0005,
  SMS_RESPONSE_TIMEOUT    = 0x0006,
  SMS_RESEND_COUNT        = 0x0007,
  MAIN_SERVER_APN         = 0x0010, // string
  MAIN_SERVER_USER        = 0x0011, // string
  MAIN_SERVER_PASS        = 0x0012, // string
  MAIN_SERVER_IP          = 0x0013, // string
  BACKUP_SERVER_APN       = 0x0016,
  BACKUP_SERVER_IP        = 0x0017,
  SERVER_TCP_PORT         = 0x0018, // DWORD
  SERVER_UDP_PORT         = 0x0019, // DWORD
  IC_CARD_REPORTING       = 0x001A,
  REPORT_INTERVAL         = 0x0020, // seconds
  REPORT_INTERVAL_DORMANT = 0x0021,
  REPORT_INTERVAL_ALARM   = 0x0022,
  OVERSPEED_THRESHOLD     = 0x0055, // km/h
  OVERSPEED_DURATION      = 0x0056, // seconds
  CONTINUOUS_DRIVE_LIMIT  = 0x0057, // seconds
  DAY_DRIVE_LIMIT         = 0x0058, // seconds
  MIN_REST_TIME           = 0x0059, // minutes
  MAX_PARK_TIME           = 0x005A, // minutes
  OVERSPEED_ALARM_DIFF    = 0x005B, // km/h
  FATIGUE_ALARM_DIFF      = 0x005C, // seconds
  COLLISION_ALARM_PARAM   = 0x0070,
  ROLLOVER_ALARM_PARAM    = 0x0071,
  PHOTO_INTERVAL          = 0x0080, // ms
  PHOTO_DISTANCE          = 0x0081, // m
  PHOTO_ON_ALARM          = 0x0082, // 0=off,1=on
  MAX_PHOTO_SIZE          = 0x0083, // KB
  MULTI_CHANNEL_VIDEO     = 0x0090,
  VIDEO_TIME              = 0x0091,
  ADAS_ALARM_ENABLE       = 0x00A0,
  DMS_ALARM_ENABLE        = 0x00A1,
}

// ─── Vehicle Control Commands ──────────────────────────────────────────────────
export enum VehicleControlCmd {
  CUT_OIL    = 0x0001, // Bit 0 set
  RESTORE_OIL = 0x0002, // Bit 1 set
  CUT_CIRCUIT = 0x0004, // Bit 2 set
  RESTORE_CIRCUIT = 0x0008, // Bit 3 set
  DOOR_LOCK  = 0x0010,
  DOOR_UNLOCK = 0x0020,
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Parser Class
// ═══════════════════════════════════════════════════════════════════════════════
export class JT808Parser {
  static readonly DELIMITER = 0x7e;
  static readonly ESCAPE    = 0x7d;

  // ── Frame encoding/decoding ──────────────────────────────────────────────────
  static unescape(data: Buffer): Buffer {
    const result: number[] = [];
    let i = 0;
    while (i < data.length) {
      if (data[i] === this.ESCAPE) {
        i++;
        result.push(data[i] === 0x01 ? 0x7d : 0x7e);
      } else {
        result.push(data[i]);
      }
      i++;
    }
    return Buffer.from(result);
  }

  static escape(data: Buffer): Buffer {
    const result: number[] = [];
    for (const byte of data) {
      if (byte === 0x7e)      { result.push(0x7d, 0x02); }
      else if (byte === 0x7d) { result.push(0x7d, 0x01); }
      else                    { result.push(byte); }
    }
    return Buffer.from(result);
  }

  static checksum(data: Buffer): number {
    let xor = 0;
    for (const byte of data) xor ^= byte;
    return xor;
  }

  static buildFrame(
    messageId: number,
    phone: string,
    serialNo: number,
    body: Buffer,
    encrypt = 0,
  ): Buffer {
    const header = Buffer.alloc(12);
    header.writeUInt16BE(messageId, 0);
    // body props: encrypt bits [12:10], body length [9:0]
    header.writeUInt16BE((encrypt << 10) | (body.length & 0x3ff), 2);
    Buffer.from(phone.padStart(12, '0'), 'hex').copy(header, 4);
    header.writeUInt16BE(serialNo & 0xffff, 10);
    const frame = Buffer.concat([header, body]);
    const cs = this.checksum(frame);
    const full = Buffer.concat([frame, Buffer.from([cs])]);
    return Buffer.concat([
      Buffer.from([this.DELIMITER]),
      this.escape(full),
      Buffer.from([this.DELIMITER]),
    ]);
  }

  static parseFrame(rawData: Buffer): JT808Message | null {
    try {
      const start = rawData.indexOf(this.DELIMITER);
      const end   = rawData.lastIndexOf(this.DELIMITER);
      if (start === -1 || end === -1 || start === end) return null;

      const inner     = rawData.subarray(start + 1, end);
      const unescaped = this.unescape(inner);

      // Validate checksum
      const cs   = unescaped[unescaped.length - 1];
      const data = unescaped.subarray(0, -1);
      if (cs !== this.checksum(data)) return null;

      const messageId    = data.readUInt16BE(0);
      const messageAttr  = data.readUInt16BE(2);
      const bodyLen      = messageAttr & 0x3ff;
      const encryptionType = (messageAttr >> 10) & 0x07;
      const isMultiPacket  = !!(messageAttr & 0x2000);

      // BCD phone: 6 bytes → 12 hex chars, strip leading zeros
      const phoneNumber = data.subarray(4, 10).toString('hex').replace(/^0+/, '') || '0';
      const serialNumber = data.readUInt16BE(10);

      let headerLen = 12;
      let totalPackets: number | undefined;
      let packetNumber: number | undefined;

      if (isMultiPacket) {
        totalPackets = data.readUInt16BE(12);
        packetNumber = data.readUInt16BE(14);
        headerLen = 16;
      }

      const messageBody = data.subarray(headerLen, headerLen + bodyLen);
      return { messageId, messageBody, phoneNumber, serialNumber, encryptionType, isMultiPacket, totalPackets, packetNumber };
    } catch { return null; }
  }

  // ── Standard responses ────────────────────────────────────────────────────────
  static buildGeneralResponse(
    phone: string, serialNo: number,
    respondSerial: number, respondId: number, result = 0,
  ): Buffer {
    const body = Buffer.alloc(5);
    body.writeUInt16BE(respondSerial, 0);
    body.writeUInt16BE(respondId, 2);
    body[4] = result;
    return this.buildFrame(MsgId.PLATFORM_GENERAL_RESPONSE, phone, serialNo, body);
  }

  static buildRegistrationResponse(
    phone: string, serialNo: number,
    respondSerial: number, result: number, authCode: string,
  ): Buffer {
    const authBuf = Buffer.from(authCode, 'ascii');
    const body = Buffer.alloc(3 + authBuf.length);
    body.writeUInt16BE(respondSerial, 0);
    body[2] = result;
    authBuf.copy(body, 3);
    return this.buildFrame(MsgId.TERMINAL_REGISTER_RESPONSE, phone, serialNo, body);
  }

  // ── Set Terminal Parameters (0x8103) ─────────────────────────────────────────
  static buildSetParams(
    phone: string, serialNo: number,
    params: { id: number; value: Buffer }[],
  ): Buffer {
    const items: Buffer[] = [];
    for (const p of params) {
      const item = Buffer.alloc(5 + p.value.length);
      item.writeUInt32BE(p.id, 0);
      item[4] = p.value.length;
      p.value.copy(item, 5);
      items.push(item);
    }
    const payload = Buffer.concat(items);
    const body = Buffer.alloc(1 + payload.length);
    body[0] = params.length;
    payload.copy(body, 1);
    return this.buildFrame(MsgId.SET_TERMINAL_PARAMS, phone, serialNo, body);
  }

  // ── Query Terminal Parameters (0x8104) ────────────────────────────────────────
  static buildQueryParams(phone: string, serialNo: number, paramIds?: number[]): Buffer {
    if (!paramIds || paramIds.length === 0) {
      return this.buildFrame(MsgId.QUERY_TERMINAL_PARAMS, phone, serialNo, Buffer.alloc(0));
    }
    const body = Buffer.alloc(1 + paramIds.length * 4);
    body[0] = paramIds.length;
    paramIds.forEach((id, i) => body.writeUInt32BE(id, 1 + i * 4));
    return this.buildFrame(MsgId.QUERY_TERMINAL_PARAMS, phone, serialNo, body);
  }

  // ── Terminal Control (0x8105) ─────────────────────────────────────────────────
  static buildTerminalControl(phone: string, serialNo: number, cmd: number, param = ''): Buffer {
    const paramBuf = Buffer.from(param, 'ascii');
    const body = Buffer.alloc(1 + paramBuf.length);
    body[0] = cmd;
    paramBuf.copy(body, 1);
    return this.buildFrame(MsgId.TERMINAL_CONTROL, phone, serialNo, body);
  }

  // ── Vehicle Control (0x8500) ──────────────────────────────────────────────────
  static buildVehicleControl(phone: string, serialNo: number, controlFlags: number): Buffer {
    const body = Buffer.alloc(1);
    body[0] = controlFlags & 0xff;
    return this.buildFrame(MsgId.VEHICLE_CONTROL, phone, serialNo, body);
  }

  // ── Query Current Location (0x8201) ──────────────────────────────────────────
  static buildLocationQuery(phone: string, serialNo: number): Buffer {
    return this.buildFrame(MsgId.QUERY_LOCATION, phone, serialNo, Buffer.alloc(0));
  }

  // ── Temporary Location Tracking Control (0x8202) ─────────────────────────────
  static buildTempTracking(
    phone: string, serialNo: number,
    interval: number, validity: number,
  ): Buffer {
    const body = Buffer.alloc(6);
    body.writeUInt16BE(interval, 0); // reporting interval (seconds)
    body.writeUInt32BE(validity, 2); // validity period (seconds)
    return this.buildFrame(MsgId.TEMP_LOCATION_TRACKING, phone, serialNo, body);
  }

  // ── Text Message (0x8300) ────────────────────────────────────────────────────
  static buildTextMessage(phone: string, serialNo: number, flags: number, text: string): Buffer {
    const textBuf = Buffer.from(text, 'utf8');
    const body = Buffer.alloc(1 + textBuf.length);
    body[0] = flags;
    textBuf.copy(body, 1);
    return this.buildFrame(MsgId.TEXT_MESSAGE, phone, serialNo, body);
  }

  // ── Camera Shoot Command (0x8801) ─────────────────────────────────────────────
  static buildCameraShoot(
    phone: string, serialNo: number,
    channel: number,
    command: number,     // 0=photo,0xffff=stop video
    interval: number,    // seconds, 0=single
    savingFlag: number,  // 0=real-time upload,1=local save
    resolution: number,  // 0=320×240,1=640×480,2=800×600,3=1024×768,4=176×144,5=352×288,0xff=1080p
    quality: number,     // 1-10
    brightness: number,
    contrast: number,
    saturation: number,
    chroma: number,
  ): Buffer {
    const body = Buffer.alloc(12);
    body[0] = channel;
    body.writeUInt16BE(command, 1);
    body.writeUInt16BE(interval, 3);
    body[5] = savingFlag;
    body[6] = resolution;
    body[7] = quality;
    body[8] = brightness;
    body[9] = contrast;
    body[10] = saturation;
    body[11] = chroma;
    return this.buildFrame(MsgId.CAMERA_SHOOT, phone, serialNo, body);
  }

  // ── Multimedia Upload Response (0x8800) ───────────────────────────────────────
  static buildMultimediaUploadResponse(
    phone: string, serialNo: number,
    mediaId: number, retransmitPackets: number[],
  ): Buffer {
    const body = Buffer.alloc(4 + 2 + retransmitPackets.length * 2);
    body.writeUInt32BE(mediaId, 0);
    body.writeUInt16BE(retransmitPackets.length, 4);
    retransmitPackets.forEach((p, i) => body.writeUInt16BE(p, 6 + i * 2));
    return this.buildFrame(MsgId.MULTIMEDIA_UPLOAD_RESPONSE, phone, serialNo, body);
  }

  // ── JT1078: Real-time Video Request (0x9101) ──────────────────────────────────
  static buildRealtimeVideoRequest(
    phone: string, serialNo: number,
    serverIp: string, serverTcpPort: number, serverUdpPort: number,
    channel: number, dataType: number, streamType: number,
  ): Buffer {
    // JT1078 spec: channel(1) + dataType(1) + streamType(1) + serverIP(41) + tcpPort(2) + udpPort(2) = 48 bytes
    const body = Buffer.alloc(48);
    body[0] = channel;
    body[1] = dataType;
    body[2] = streamType;
    const ipBytes = Buffer.from(serverIp);
    ipBytes.copy(body, 3, 0, Math.min(ipBytes.length, 41));
    body.writeUInt16BE(serverTcpPort, 44);
    body.writeUInt16BE(serverUdpPort, 46);
    return this.buildFrame(MsgId.REALTIME_VIDEO_REQUEST, phone, serialNo, body);
  }

  // ── JT1078: Video Stream Control (0x9102) ────────────────────────────────────
  static buildVideoControl(
    phone: string, serialNo: number,
    channel: number, command: number,
    closeType?: number,
  ): Buffer {
    // command: 0=close stream,1=switch to main stream,2=switch to sub stream
    const body = Buffer.alloc(closeType !== undefined ? 3 : 2);
    body[0] = channel;
    body[1] = command;
    if (closeType !== undefined) body[2] = closeType;
    return this.buildFrame(MsgId.REALTIME_VIDEO_CONTROL, phone, serialNo, body);
  }

  // ── JT1078: Historical Video Playback Request (0x9201) ────────────────────────
  static buildHistVideoRequest(
    phone: string, serialNo: number,
    channel: number, mediaType: number, streamType: number, storageType: number,
    playbackMode: number, playbackSpeed: number,
    startTime: Date, endTime: Date,
    serverIp: string, serverTcpPort: number, serverUdpPort: number,
  ): Buffer {
    const ipBuf = Buffer.alloc(41);
    Buffer.from(serverIp).copy(ipBuf);
    const body = Buffer.alloc(64);
    body[0] = channel;
    body[1] = mediaType;
    body[2] = streamType;
    body[3] = storageType;
    body[4] = playbackMode;
    body[5] = playbackSpeed;
    this.encodeBcdTime(startTime).copy(body, 6);
    this.encodeBcdTime(endTime).copy(body, 12);
    ipBuf.copy(body, 18);
    body.writeUInt16BE(serverTcpPort, 59);
    body.writeUInt16BE(serverUdpPort, 61);
    return this.buildFrame(MsgId.HIST_VIDEO_PLAYBACK_REQ, phone, serialNo, body);
  }

  // ── JT1078: File List Query (0x9205) ─────────────────────────────────────────
  static buildFileListQuery(
    phone: string, serialNo: number,
    channel: number, startTime: Date, endTime: Date,
    alarmFlag: number, mediaType: number, storageType: number,
  ): Buffer {
    const body = Buffer.alloc(21);
    body[0] = channel;
    this.encodeBcdTime(startTime).copy(body, 1);
    this.encodeBcdTime(endTime).copy(body, 7);
    body.writeUInt32BE(alarmFlag, 13);
    body[17] = mediaType;
    body[18] = storageType;
    body[19] = 0; // start page
    body[20] = 20; // page size
    return this.buildFrame(MsgId.FILE_LIST_QUERY, phone, serialNo, body);
  }

  // ── JT1078: File Upload Control (0x9206) ─────────────────────────────────────
  static buildFileUploadControl(
    phone: string, serialNo: number,
    serverIp: string, serverTcpPort: number,
    channel: number, startTime: Date, endTime: Date,
    alarmFlag: number, mediaType: number, storageType: number,
    taskId: number, condition: number,
  ): Buffer {
    const ipBuf = Buffer.alloc(41);
    Buffer.from(serverIp).copy(ipBuf);
    const body = Buffer.alloc(70);
    ipBuf.copy(body, 0);
    body.writeUInt16BE(serverTcpPort, 41);
    body[43] = channel;
    this.encodeBcdTime(startTime).copy(body, 44);
    this.encodeBcdTime(endTime).copy(body, 50);
    body.writeUInt32BE(alarmFlag, 56);
    body[60] = mediaType;
    body[61] = storageType;
    body[62] = taskId;
    body[63] = condition;
    return this.buildFrame(MsgId.FILE_UPLOAD_CONTROL, phone, serialNo, body);
  }

  // ── JT1078: Push Vehicle Alarm (0x9208) ──────────────────────────────────────
  static buildPushVehicleAlarm(
    phone: string, serialNo: number,
    msgSerial: number, alarmTime: Date,
    alarmSrc: number, alarmType: number, alarmLevel: number,
    description: string, operatorId: string,
  ): Buffer {
    const descBuf = Buffer.from(description, 'utf8');
    const opBuf = Buffer.from(operatorId, 'ascii');
    const body = Buffer.alloc(14 + 1 + descBuf.length + 1 + opBuf.length);
    body.writeUInt32BE(msgSerial, 0);
    this.encodeBcdTime(alarmTime).copy(body, 4);
    body[10] = alarmSrc;
    body.writeUInt16BE(alarmType, 11);
    body[13] = alarmLevel;
    body[14] = descBuf.length;
    descBuf.copy(body, 15);
    body[15 + descBuf.length] = opBuf.length;
    opBuf.copy(body, 16 + descBuf.length);
    return this.buildFrame(MsgId.PUSH_VEHICLE_ALARM, phone, serialNo, body);
  }

  // ── PTZ Camera Control (0x9301) ───────────────────────────────────────────────
  static buildPtzControl(
    phone: string, serialNo: number,
    channel: number, speed: number, cmd: number,
  ): Buffer {
    const body = Buffer.alloc(3);
    body[0] = channel;
    body[1] = speed;
    body[2] = cmd;
    return this.buildFrame(MsgId.PTZ_CONTROL, phone, serialNo, body);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  Parsers (Terminal → Platform)
  // ─────────────────────────────────────────────────────────────────────────────

  // ── 0x0200/0x0201: Location Report ───────────────────────────────────────────
  static parseLocation(body: Buffer): LocationData {
    if (body.length < 28) throw new Error('Location body too short');

    const alarmWord  = body.readUInt32BE(0);
    const statusWord = body.readUInt32BE(4);
    const latRaw     = body.readUInt32BE(8)  / 1_000_000;
    const lngRaw     = body.readUInt32BE(12) / 1_000_000;
    const altitude   = body.readUInt16BE(16);
    const speed      = body.readUInt16BE(18) / 10;
    const heading    = body.readUInt16BE(20);

    const bcd = (b: number) => Math.floor(b / 16) * 10 + (b & 0x0f);
    const yr = bcd(body[22]), mo = bcd(body[23]), dy = bcd(body[24]);
    const hh = bcd(body[25]), mm = bcd(body[26]), ss = bcd(body[27]);
    const timestamp = new Date(2000 + yr, mo - 1, dy, hh, mm, ss);

    // ── Status flags (all 32 bits) ───────────────────────────────────────────
    const statusFlags: StatusFlags = {
      accOn:         !!(statusWord & 0x00000001),
      located:       !!(statusWord & 0x00000002),
      latitude:      (statusWord & 0x00000004) ? 'south' : 'north',
      longitude:     (statusWord & 0x00000008) ? 'west'  : 'east',
      inOperation:   !!(statusWord & 0x00000010),
      encrypted:     !!(statusWord & 0x00000020),
      loadBit:       (statusWord >> 6) & 0x03,
      oilRouteOn:    !!(statusWord & 0x00000400),
      circuitOn:     !!(statusWord & 0x00000800),
      doorLocked:    !!(statusWord & 0x00001000),
      door1Open:     !!(statusWord & 0x00002000),
      door2Open:     !!(statusWord & 0x00004000),
      door3Open:     !!(statusWord & 0x00008000),
      door4Open:     !!(statusWord & 0x00010000),
      door5Open:     !!(statusWord & 0x00020000),
      gpsUsed:       !!(statusWord & 0x00040000),
      bdsUsed:       !!(statusWord & 0x00080000),
      glonassUsed:   !!(statusWord & 0x00100000),
      galileoUsed:   !!(statusWord & 0x00200000),
    };

    // ── Alarm flags (all 32 bits) ────────────────────────────────────────────
    const alarmFlags: AlarmFlags = {
      sos:                !!(alarmWord & 0x00000001),
      overSpeed:          !!(alarmWord & 0x00000002),
      fatigue:            !!(alarmWord & 0x00000004),
      danger:             !!(alarmWord & 0x00000008),
      gnssFault:          !!(alarmWord & 0x00000010),
      gnssAntennaDisconnect: !!(alarmWord & 0x00000020),
      gnssAntennaShorting:   !!(alarmWord & 0x00000040),
      lowPower:           !!(alarmWord & 0x00000080),
      powerCut:           !!(alarmWord & 0x00000100),
      vehicleTheft:       !!(alarmWord & 0x00000200),
      illegalIgnition:    !!(alarmWord & 0x00000400),
      illegalDisplacement:!!(alarmWord & 0x00000800),
      collision:          !!(alarmWord & 0x00001000),
      rollover:           !!(alarmWord & 0x00002000),
      illegalDoorOpen:    !!(alarmWord & 0x00004000),
      vssFault:           !!(alarmWord & 0x00008000),
      dayOverSpeed:       !!(alarmWord & 0x00010000),
      nightOverSpeed:     !!(alarmWord & 0x00020000),
      routeDeviation:     !!(alarmWord & 0x00040000),
      routeSectionTimeLow:!!(alarmWord & 0x00080000),
      routeSectionTimeHigh:!!(alarmWord & 0x00100000),
      routeTransportTimeout:!!(alarmWord & 0x00200000),
      vehicleFuelAbnormal:!!(alarmWord & 0x00400000),
      vehicleRadioFault:  !!(alarmWord & 0x00800000),
      adasFCW:            !!(alarmWord & 0x01000000),
      adasLDW:            !!(alarmWord & 0x02000000),
      adasPCW:            !!(alarmWord & 0x04000000),
      adasBSM:            !!(alarmWord & 0x08000000),
      dmsFatigue:         !!(alarmWord & 0x10000000),
      dmsDistraction:     !!(alarmWord & 0x20000000),
      dmsPhone:           !!(alarmWord & 0x40000000),
      dmsSmoking:         !!(alarmWord & 0x80000000),
    };

    // ── Supplementary data items ─────────────────────────────────────────────
    const loc: LocationData = {
      latitude:  statusFlags.latitude  === 'south' ? -latRaw : latRaw,
      longitude: statusFlags.longitude === 'west'  ? -lngRaw : lngRaw,
      altitude, speed, heading, timestamp,
      alarmFlags, statusFlags,
      engineOn: statusFlags.accOn || false,
      gpsValid: statusFlags.located || false,
    };

    let offset = 28;
    while (offset + 2 <= body.length) {
      const infoId  = body[offset];
      const infoLen = body[offset + 1];
      if (offset + 2 + infoLen > body.length) break;
      const d = body.subarray(offset + 2, offset + 2 + infoLen);
      offset += 2 + infoLen;

      switch (infoId) {
        case 0x01: loc.mileage         = d.readUInt32BE(0) / 10;  break; // km/10
        case 0x02: loc.fuelLevel       = d.readUInt16BE(0) / 10;  break; // %/10
        case 0x03: loc.speedFromOBD    = d.readUInt16BE(0) / 10;  break;
        case 0x04: loc.engineRpm       = d.readUInt16BE(0);        break;
        case 0x05: loc.engineWaterTemp = d[0];                     break; // °C
        case 0x06: loc.fuelConsumption = d.readUInt16BE(0) / 10;  break;
        case 0x07: loc.recordSpeed     = d.readUInt16BE(0);        break;
        case 0x08: loc.alarmEventId    = d.readUInt32BE(0);        break;
        case 0x09: loc.tiresInfo       = d;                        break;
        case 0x0A: loc.overdraftAlarm  = d[0];                     break;
        case 0x25: /* cumulative driving time - ignore */ break;
        case 0x30: loc.satellites      = d[0];                     break;
        case 0x31: loc.signalStrength  = d[0];                     break;
        case 0x32: loc.gnssPositionCount = d.readUInt16BE(0);      break;
        case 0x33: loc.gnssSpeed       = d.readUInt16BE(0) / 10;   break;
        // ── JT1078 ADAS supplementary item ──────────────────────────────────
        case 0x64:
          if (d.length >= 7) {
            loc.adasAlert = {
              alarmId:        d.readUInt32BE(0),
              flagState:      d[4],
              alarmType:      d[5],
              speed:          d.length > 6 ? d[6] : undefined,
              cameraChannels: d.length > 7 ? d[7] : undefined,
              videoDuration:  d.length > 8 ? d[8] : undefined,
              picCount:       d.length > 9 ? d[9] : undefined,
            };
            // Map alarmType to alarmFlags
            if (loc.adasAlert.alarmType === 0) alarmFlags.adasFCW = true;
            if (loc.adasAlert.alarmType === 1) alarmFlags.adasLDW = true;
            if (loc.adasAlert.alarmType === 3) alarmFlags.adasPCW = true;
            if (loc.adasAlert.alarmType === 4) alarmFlags.adasBSM = true;
          }
          break;
        // ── JT1078 DMS supplementary item ───────────────────────────────────
        case 0x65:
          if (d.length >= 7) {
            loc.dmsAlert = {
              alarmId:        d.readUInt32BE(0),
              flagState:      d[4],
              alarmType:      d[5],
              speed:          d.length > 6 ? d[6] : undefined,
              cameraChannels: d.length > 7 ? d[7] : undefined,
              videoDuration:  d.length > 8 ? d[8] : undefined,
              picCount:       d.length > 9 ? d[9] : undefined,
            };
            if (loc.dmsAlert.alarmType === 0) alarmFlags.dmsFatigue     = true;
            if (loc.dmsAlert.alarmType === 1) alarmFlags.dmsDistraction = true;
            if (loc.dmsAlert.alarmType === 2) alarmFlags.dmsPhone        = true;
            if (loc.dmsAlert.alarmType === 3) alarmFlags.dmsSmoking      = true;
          }
          break;
        default: break;
      }
    }
    return loc;
  }

  // ── 0x0100: Terminal Registration ────────────────────────────────────────────
  static parseRegistration(body: Buffer) {
    const provinceId     = body.readUInt16BE(0);
    const cityId         = body.readUInt16BE(2);
    const manufacturerId = body.subarray(4, 9).toString('ascii').replace(/\0/g, '').trim();
    const terminalModel  = body.subarray(9, 29).toString('ascii').replace(/\0/g, '').trim();
    const terminalId     = body.subarray(29, 36).toString('ascii').replace(/\0/g, '').trim();
    const plateColor     = body[36];
    const plateNumber    = body.subarray(37).toString('utf8').replace(/\0/g, '').trim();
    return { provinceId, cityId, manufacturerId, terminalModel, terminalId, plateColor, plateNumber };
  }

  // ── 0x0107: Terminal Properties ──────────────────────────────────────────────
  static parseTerminalProperties(body: Buffer): TerminalProperties {
    const terminalType  = body.readUInt16BE(0);
    const manufacturer  = body.subarray(2, 7).toString('ascii').trim();
    const terminalModel = body.subarray(7, 27).toString('ascii').replace(/\0/g, '').trim();
    const terminalId    = body.subarray(27, 34).toString('ascii').replace(/\0/g, '').trim();
    const simIccid      = body.subarray(34, 44).toString('ascii').trim();
    const hwVerLen      = body[44];
    const hwVersion     = body.subarray(45, 45 + hwVerLen).toString('ascii');
    const fwVerLen      = body[45 + hwVerLen];
    const fwVersion     = body.subarray(46 + hwVerLen, 46 + hwVerLen + fwVerLen).toString('ascii');
    let off = 46 + hwVerLen + fwVerLen;
    const gnssModuleAttr = body.readUInt32BE(off);
    const commModuleAttr = body.readUInt32BE(off + 4);
    return { terminalType, manufacturer, terminalModel, terminalId, simIccid, hwVersion, fwVersion, gnssModuleAttr, commModuleAttr };
  }

  // ── 0x0104: Terminal Parameters Response ──────────────────────────────────────
  static parseTerminalParamsResponse(body: Buffer): { respondSerial: number; params: TerminalParam[] } {
    const respondSerial = body.readUInt16BE(0);
    const count = body[2];
    const params: TerminalParam[] = [];
    let offset = 3;
    for (let i = 0; i < count && offset + 5 <= body.length; i++) {
      const id  = body.readUInt32BE(offset);
      const len = body[offset + 4];
      const value = body.subarray(offset + 5, offset + 5 + len);
      params.push({ id, value });
      offset += 5 + len;
    }
    return { respondSerial, params };
  }

  // ── 0x0800: Multimedia Event Information Upload ────────────────────────────────
  static parseMultimediaEvent(body: Buffer): MultimediaEvent {
    const mediaId   = body.readUInt32BE(0);
    const mediaType = body[4];
    const channel   = body[5];
    const event     = body[6];
    let location: LocationData | null = null;
    if (body.length > 7) {
      try { location = this.parseLocation(body.subarray(7)); } catch { /* ignore */ }
    }
    return { mediaId, mediaType, channel, event, location };
  }

  // ── 0x0801: Multimedia Data Upload ────────────────────────────────────────────
  static parseMultimediaData(body: Buffer): MultimediaData {
    const mediaId     = body.readUInt32BE(0);
    const mediaType   = body[4];
    const mediaFormat = body[5];
    const event       = body[6];
    const channel     = body[7];
    let location: LocationData | null = null;
    const locEnd = 8 + 28; // min location size
    if (body.length > locEnd) {
      try { location = this.parseLocation(body.subarray(8, locEnd)); } catch { /* ignore */ }
    }
    const data = body.subarray(locEnd < body.length ? locEnd : 8);
    return { mediaId, mediaType, mediaFormat, event, channel, location, data, isComplete: true };
  }

  // ── 0x0500: Vehicle Control Response ──────────────────────────────────────────
  static parseVehicleControlResponse(body: Buffer): VehicleControlResponse {
    const serialNumber = body.readUInt16BE(0);
    let location: LocationData | null = null;
    if (body.length > 2) {
      try { location = this.parseLocation(body.subarray(2)); } catch { /* ignore */ }
    }
    return { serialNumber, location };
  }

  // ── 0x0702: Driver Identity ────────────────────────────────────────────────────
  static parseDriverIdentity(body: Buffer) {
    const status  = body[0]; // 0x01=insert,0x02=extract
    const time    = this.decodeBcdTime(body.subarray(1, 7));
    const icResult = body[7]; // 0=normal,1=read fail,2=IC expired,3=not certified,4=re-read
    const nameLen = body[8];
    const name    = body.subarray(9, 9 + nameLen).toString('utf8');
    let offset = 9 + nameLen;
    const certCode = body.subarray(offset, offset + 20).toString('ascii').trim();
    offset += 20;
    const orgLen = body[offset];
    const orgName = body.subarray(offset + 1, offset + 1 + orgLen).toString('utf8');
    offset += 1 + orgLen;
    const certExpiry = this.decodeBcdTime(body.subarray(offset, offset + 4)); // YYMMDD
    return { status, time, icResult, name, certCode, orgName, certExpiry };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────────
  static encodeBcdTime(d: Date): Buffer {
    const buf = Buffer.alloc(6);
    buf[0] = d.getFullYear() - 2000;
    buf[1] = d.getMonth() + 1;
    buf[2] = d.getDate();
    buf[3] = d.getHours();
    buf[4] = d.getMinutes();
    buf[5] = d.getSeconds();
    return buf;
  }

  static decodeBcdTime(buf: Buffer): Date {
    return new Date(2000 + buf[0], buf[1] - 1, buf[2], buf[3] || 0, buf[4] || 0, buf[5] || 0);
  }

  /** Map numeric ADAS alarm type to readable string */
  static adasAlarmTypeName(t: number): string {
    return ['FCW','LDW','HMWW','PCW','BSM','TSR','RoadSign','NoLane'][t] ?? `ADAS_${t}`;
  }

  /** Map numeric DMS alarm type to readable string */
  static dmsAlarmTypeName(t: number): string {
    return ['Fatigue','Distraction','Phone','Smoking','NoDriver','Infrared'][t] ?? `DMS_${t}`;
  }
}
