export declare enum AlertType {
    SPEEDING = "speeding",
    GEOFENCE_ENTER = "geofence_enter",
    GEOFENCE_EXIT = "geofence_exit",
    SOS = "sos",
    POWER_CUT = "power_cut",
    LOW_BATTERY = "low_battery",
    HARSH_BRAKING = "harsh_braking",
    HARSH_ACCELERATION = "harsh_acceleration",
    HARSH_CORNERING = "harsh_cornering",
    COLLISION = "collision",
    ROLLOVER = "rollover",
    FATIGUE_DRIVING = "fatigue_driving",
    LANE_DEPARTURE = "lane_departure",
    FORWARD_COLLISION = "forward_collision",
    ADAS_PCW = "adas_pcw",
    ADAS_BSM = "adas_bsm",
    DMS_FATIGUE = "dms_fatigue",
    DMS_DISTRACTION = "dms_distraction",
    DMS_PHONE = "dms_phone",
    DMS_SMOKING = "dms_smoking",
    VEHICLE_THEFT = "vehicle_theft",
    UNAUTHORIZED_IGNITION = "unauthorized_ignition",
    GNSS_FAULT = "gnss_fault",
    ENGINE_ON = "engine_on",
    ENGINE_OFF = "engine_off",
    DEVICE_OFFLINE = "device_offline",
    TAMPERING = "tampering",
    OTHER = "other"
}
export declare enum AlertSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare class Alert {
    id: number;
    deviceId: number;
    imei: string;
    deviceName: string;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    latitude: number;
    longitude: number;
    speed: number;
    geofenceId: number;
    geofenceName: string;
    isRead: boolean;
    isResolved: boolean;
    resolvedBy: number;
    resolvedAt: Date;
    extraData: any;
    timestamp: Date;
    createdAt: Date;
}
