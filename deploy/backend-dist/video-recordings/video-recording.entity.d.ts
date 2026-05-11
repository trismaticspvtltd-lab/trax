export declare enum RecordingType {
    ALARM = "alarm",
    MANUAL = "manual",
    LIVE = "live"
}
export declare enum RecordingStatus {
    PENDING = "pending",
    RECORDING = "recording",
    PROCESSING = "processing",
    COMPLETE = "complete",
    FAILED = "failed"
}
export declare class VideoRecording {
    id: number;
    imei: string;
    deviceId: number;
    deviceName: string;
    channel: number;
    type: RecordingType;
    status: RecordingStatus;
    alarmType: string;
    alarmMessage: string;
    s3VideoKey: string;
    s3ImageKeys: string[];
    videoUrl: string;
    imageUrls: string[];
    durationSeconds: number;
    fileSizeBytes: number;
    latitude: number;
    longitude: number;
    speed: number;
    startTime: Date;
    endTime: Date;
    errorMessage: string;
    metadata: any;
    createdAt: Date;
}
