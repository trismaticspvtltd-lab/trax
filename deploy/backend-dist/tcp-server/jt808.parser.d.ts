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
export interface AlarmFlags {
    sos?: boolean;
    overSpeed?: boolean;
    fatigue?: boolean;
    danger?: boolean;
    gnssFault?: boolean;
    gnssAntennaDisconnect?: boolean;
    gnssAntennaShorting?: boolean;
    lowPower?: boolean;
    powerCut?: boolean;
    vehicleTheft?: boolean;
    illegalIgnition?: boolean;
    illegalDisplacement?: boolean;
    collision?: boolean;
    rollover?: boolean;
    illegalDoorOpen?: boolean;
    vssFault?: boolean;
    dayOverSpeed?: boolean;
    nightOverSpeed?: boolean;
    routeDeviation?: boolean;
    routeSectionTimeLow?: boolean;
    routeSectionTimeHigh?: boolean;
    routeTransportTimeout?: boolean;
    vehicleFuelAbnormal?: boolean;
    vehicleRadioFault?: boolean;
    adasFCW?: boolean;
    adasLDW?: boolean;
    adasPCW?: boolean;
    adasBSM?: boolean;
    dmsFatigue?: boolean;
    dmsDistraction?: boolean;
    dmsPhone?: boolean;
    dmsSmoking?: boolean;
}
export interface StatusFlags {
    accOn?: boolean;
    located?: boolean;
    latitude?: 'north' | 'south';
    longitude?: 'east' | 'west';
    inOperation?: boolean;
    encrypted?: boolean;
    loadBit?: number;
    oilRouteOn?: boolean;
    circuitOn?: boolean;
    doorLocked?: boolean;
    door1Open?: boolean;
    door2Open?: boolean;
    door3Open?: boolean;
    door4Open?: boolean;
    door5Open?: boolean;
    gpsUsed?: boolean;
    bdsUsed?: boolean;
    glonassUsed?: boolean;
    galileoUsed?: boolean;
}
export interface LocationData {
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    heading: number;
    timestamp: Date;
    alarmFlags: AlarmFlags;
    statusFlags: StatusFlags;
    mileage?: number;
    fuelLevel?: number;
    speedFromOBD?: number;
    engineRpm?: number;
    engineWaterTemp?: number;
    fuelConsumption?: number;
    recordSpeed?: number;
    alarmEventId?: number;
    tiresInfo?: Buffer;
    overdraftAlarm?: number;
    satellites?: number;
    signalStrength?: number;
    gnssPositionCount?: number;
    gnssSpeed?: number;
    customInfo?: Buffer;
    adasAlert?: AdasAlert;
    dmsAlert?: DmsAlert;
    engineOn: boolean;
    gpsValid: boolean;
}
export interface AdasAlert {
    alarmId: number;
    flagState: number;
    alarmType: number;
    speed?: number;
    cameraChannels?: number;
    videoDuration?: number;
    picCount?: number;
}
export interface DmsAlert {
    alarmId: number;
    flagState: number;
    alarmType: number;
    speed?: number;
    cameraChannels?: number;
    videoDuration?: number;
    picCount?: number;
}
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
export interface MultimediaEvent {
    mediaId: number;
    mediaType: number;
    channel: number;
    event: number;
    location: LocationData | null;
}
export interface MultimediaData {
    mediaId: number;
    mediaType: number;
    mediaFormat: number;
    event: number;
    channel: number;
    location: LocationData | null;
    data: Buffer;
    isComplete: boolean;
    totalPackets?: number;
    packetSeq?: number;
}
export interface VehicleControlResponse {
    serialNumber: number;
    location: LocationData | null;
}
export interface TerminalParam {
    id: number;
    value: Buffer;
}
export declare enum MsgId {
    TERMINAL_GENERAL_RESPONSE = 1,
    HEARTBEAT = 2,
    TERMINAL_DEREGISTER = 3,
    TERMINAL_REGISTER = 256,
    TERMINAL_PARAMS_RESPONSE = 260,
    TERMINAL_PROPS_RESPONSE = 263,
    UPGRADE_RESULT = 264,
    TERMINAL_AUTH = 258,
    LOCATION_REPORT = 512,
    LOCATION_QUERY_RESPONSE = 513,
    LOCATION_BULK = 1796,
    EVENT_REPORT = 769,
    QUESTION_ANSWER = 770,
    INFO_ON_DEMAND = 771,
    DRIVER_IDENTITY = 1794,
    TACHOGRAPH_DATA = 1792,
    ELEC_WAYBILL = 1793,
    CAN_BUS_DATA = 1797,
    MULTIMEDIA_EVENT = 2048,
    MULTIMEDIA_DATA = 2049,
    MULTIMEDIA_SEARCH_RESPONSE = 2050,
    VEHICLE_CONTROL_RESPONSE = 1280,
    RSA_KEY = 2560,
    VIDEO_STREAM_SUBSCRIBE = 4101,
    HISTORICAL_STREAM_CONTROL = 4614,
    FILE_UPLOAD_COMPLETE = 4613,
    ALARM_ATTACH_UPLOAD = 4624,
    CAMERA_SHOOT_RESPONSE = 4614,
    PLATFORM_GENERAL_RESPONSE = 32769,
    RESEND_PACKET = 32771,
    TERMINAL_REGISTER_RESPONSE = 33024,
    SET_TERMINAL_PARAMS = 33027,
    QUERY_TERMINAL_PARAMS = 33028,
    TERMINAL_CONTROL = 33029,
    UPGRADE_PACKAGE = 33032,
    QUERY_LOCATION = 33281,
    TEMP_LOCATION_TRACKING = 33282,
    TEXT_MESSAGE = 33536,
    SET_EVENTS = 33537,
    ISSUE_QUESTION = 33538,
    INFO_MENU_SETTING = 33539,
    CALL_BACK = 33792,
    SET_PHONEBOOK = 33793,
    VEHICLE_CONTROL = 34048,
    SET_CIRCLE_AREA = 34304,
    DELETE_CIRCLE_AREA = 34305,
    SET_RECT_AREA = 34306,
    DELETE_RECT_AREA = 34307,
    SET_POLYGON_AREA = 34308,
    DELETE_POLYGON_AREA = 34309,
    SET_ROUTE = 34310,
    DELETE_ROUTE = 34311,
    QUERY_LOCATION_AREA_ROUTE = 34312,
    DRIVING_RECORD_DATA_COLLECT = 34560,
    MULTIMEDIA_UPLOAD_RESPONSE = 34816,
    CAMERA_SHOOT = 34817,
    MULTIMEDIA_SEARCH = 34818,
    RECORDING = 34820,
    MULTIMEDIA_SINGLE_UPLOAD = 34821,
    RSA_PUBKEY = 35328,
    REALTIME_VIDEO_REQUEST = 37121,
    REALTIME_VIDEO_CONTROL = 37122,
    REALTIME_VIDEO_SWITCH = 37123,
    HIST_VIDEO_PLAYBACK_REQ = 37377,
    HIST_VIDEO_PLAYBACK_CTRL = 37378,
    FILE_LIST_QUERY = 37381,
    FILE_UPLOAD_CONTROL = 37382,
    PUSH_VEHICLE_ALARM = 37384,
    PTZ_CONTROL = 37633,
    CAMERA_PARAM_QUERY = 37634,
    CAMERA_PARAM_RESPONSE = 37635,
    CAMERA_RECORD_CONTROL = 37636,
    STORAGE_MEDIA_QUERY = 37637,
    STORAGE_MEDIA_QUERY_RESPONSE = 37638
}
export declare enum ParamId {
    HEARTBEAT_INTERVAL = 1,
    TCP_RESPONSE_TIMEOUT = 2,
    TCP_RESEND_COUNT = 3,
    UDP_RESPONSE_TIMEOUT = 4,
    UDP_RESEND_COUNT = 5,
    SMS_RESPONSE_TIMEOUT = 6,
    SMS_RESEND_COUNT = 7,
    MAIN_SERVER_APN = 16,
    MAIN_SERVER_USER = 17,
    MAIN_SERVER_PASS = 18,
    MAIN_SERVER_IP = 19,
    BACKUP_SERVER_APN = 22,
    BACKUP_SERVER_IP = 23,
    SERVER_TCP_PORT = 24,
    SERVER_UDP_PORT = 25,
    IC_CARD_REPORTING = 26,
    REPORT_INTERVAL = 32,
    REPORT_INTERVAL_DORMANT = 33,
    REPORT_INTERVAL_ALARM = 34,
    OVERSPEED_THRESHOLD = 85,
    OVERSPEED_DURATION = 86,
    CONTINUOUS_DRIVE_LIMIT = 87,
    DAY_DRIVE_LIMIT = 88,
    MIN_REST_TIME = 89,
    MAX_PARK_TIME = 90,
    OVERSPEED_ALARM_DIFF = 91,
    FATIGUE_ALARM_DIFF = 92,
    COLLISION_ALARM_PARAM = 112,
    ROLLOVER_ALARM_PARAM = 113,
    PHOTO_INTERVAL = 128,
    PHOTO_DISTANCE = 129,
    PHOTO_ON_ALARM = 130,
    MAX_PHOTO_SIZE = 131,
    MULTI_CHANNEL_VIDEO = 144,
    VIDEO_TIME = 145,
    ADAS_ALARM_ENABLE = 160,
    DMS_ALARM_ENABLE = 161
}
export declare enum VehicleControlCmd {
    CUT_OIL = 1,
    RESTORE_OIL = 2,
    CUT_CIRCUIT = 4,
    RESTORE_CIRCUIT = 8,
    DOOR_LOCK = 16,
    DOOR_UNLOCK = 32
}
export declare class JT808Parser {
    static readonly DELIMITER = 126;
    static readonly ESCAPE = 125;
    static unescape(data: Buffer): Buffer;
    static escape(data: Buffer): Buffer;
    static checksum(data: Buffer): number;
    static buildFrame(messageId: number, phone: string, serialNo: number, body: Buffer, encrypt?: number): Buffer;
    static parseFrame(rawData: Buffer): JT808Message | null;
    static buildGeneralResponse(phone: string, serialNo: number, respondSerial: number, respondId: number, result?: number): Buffer;
    static buildRegistrationResponse(phone: string, serialNo: number, respondSerial: number, result: number, authCode: string): Buffer;
    static buildSetParams(phone: string, serialNo: number, params: {
        id: number;
        value: Buffer;
    }[]): Buffer;
    static buildQueryParams(phone: string, serialNo: number, paramIds?: number[]): Buffer;
    static buildTerminalControl(phone: string, serialNo: number, cmd: number, param?: string): Buffer;
    static buildVehicleControl(phone: string, serialNo: number, controlFlags: number): Buffer;
    static buildLocationQuery(phone: string, serialNo: number): Buffer;
    static buildTempTracking(phone: string, serialNo: number, interval: number, validity: number): Buffer;
    static buildTextMessage(phone: string, serialNo: number, flags: number, text: string): Buffer;
    static buildCameraShoot(phone: string, serialNo: number, channel: number, command: number, interval: number, savingFlag: number, resolution: number, quality: number, brightness: number, contrast: number, saturation: number, chroma: number): Buffer;
    static buildMultimediaUploadResponse(phone: string, serialNo: number, mediaId: number, retransmitPackets: number[]): Buffer;
    static buildRealtimeVideoRequest(phone: string, serialNo: number, serverIp: string, serverTcpPort: number, serverUdpPort: number, channel: number, dataType: number, streamType: number): Buffer;
    static buildVideoControl(phone: string, serialNo: number, channel: number, command: number, closeType?: number): Buffer;
    static buildHistVideoRequest(phone: string, serialNo: number, channel: number, mediaType: number, streamType: number, storageType: number, playbackMode: number, playbackSpeed: number, startTime: Date, endTime: Date, serverIp: string, serverTcpPort: number, serverUdpPort: number): Buffer;
    static buildFileListQuery(phone: string, serialNo: number, channel: number, startTime: Date, endTime: Date, alarmFlag: number, mediaType: number, storageType: number): Buffer;
    static buildFileUploadControl(phone: string, serialNo: number, serverIp: string, serverTcpPort: number, channel: number, startTime: Date, endTime: Date, alarmFlag: number, mediaType: number, storageType: number, taskId: number, condition: number): Buffer;
    static buildPushVehicleAlarm(phone: string, serialNo: number, msgSerial: number, alarmTime: Date, alarmSrc: number, alarmType: number, alarmLevel: number, description: string, operatorId: string): Buffer;
    static buildPtzControl(phone: string, serialNo: number, channel: number, speed: number, cmd: number): Buffer;
    static parseLocation(body: Buffer): LocationData;
    static parseRegistration(body: Buffer): {
        provinceId: number;
        cityId: number;
        manufacturerId: string;
        terminalModel: string;
        terminalId: string;
        plateColor: number;
        plateNumber: string;
    };
    static parseTerminalProperties(body: Buffer): TerminalProperties;
    static parseTerminalParamsResponse(body: Buffer): {
        respondSerial: number;
        params: TerminalParam[];
    };
    static parseMultimediaEvent(body: Buffer): MultimediaEvent;
    static parseMultimediaData(body: Buffer): MultimediaData;
    static parseVehicleControlResponse(body: Buffer): VehicleControlResponse;
    static parseDriverIdentity(body: Buffer): {
        status: number;
        time: Date;
        icResult: number;
        name: string;
        certCode: string;
        orgName: string;
        certExpiry: Date;
    };
    static encodeBcdTime(d: Date): Buffer;
    static decodeBcdTime(buf: Buffer): Date;
    static adasAlarmTypeName(t: number): string;
    static dmsAlarmTypeName(t: number): string;
}
