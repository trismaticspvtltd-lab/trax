import { Repository } from 'typeorm';
import { VideoRecording, RecordingType, RecordingStatus } from './video-recording.entity';
import { S3Service } from '../s3/s3.service';
export interface PendingCapture {
    recordingId: number;
    imei: string;
    alarmType: string;
    startedAt: Date;
    photoCount: number;
    targetPhotoCount: number;
    recordingStartedAt?: Date;
}
export declare class VideoRecordingsService {
    private repo;
    private s3;
    private readonly logger;
    private readonly pendingCaptures;
    constructor(repo: Repository<VideoRecording>, s3: S3Service);
    createAlarmRecording(imei: string, deviceId: number, deviceName: string, alarmType: string, alarmMessage: string, location: {
        latitude?: number;
        longitude?: number;
        speed?: number;
    }): Promise<VideoRecording>;
    handleIncomingPhoto(imei: string, jpegBuffer: Buffer, localFilename: string): Promise<void>;
    markRecordingStarted(imei: string): number | null;
    finalizeVideoRecording(imei: string, mp4Buffer: Buffer, durationSeconds: number): Promise<void>;
    finalizeRawH264Recording(imei: string, h264Buffer: Buffer, durationSeconds: number): Promise<void>;
    createManualRecording(imei: string, deviceId: number, deviceName: string, channel: number): Promise<VideoRecording>;
    finalizeManualRecording(imei: string, mp4Buffer: Buffer, durationSeconds: number): Promise<void>;
    findAll(filters?: {
        imei?: string;
        deviceId?: number;
        type?: RecordingType;
        status?: RecordingStatus;
        from?: Date;
        to?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        items: VideoRecording[];
        total: number;
    }>;
    findOne(id: number): Promise<VideoRecording>;
    findOneWithUrls(id: number): Promise<VideoRecording & {
        videoUrl?: string;
        imageUrls?: string[];
    }>;
    remove(id: number): Promise<void>;
    getPendingCapture(imei: string): PendingCapture | undefined;
    hasPendingCapture(imei: string): boolean;
}
