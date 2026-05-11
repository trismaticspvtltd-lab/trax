import { VideoRecordingsService } from './video-recordings.service';
import { RecordingType, RecordingStatus } from './video-recording.entity';
export declare class VideoRecordingsController {
    private service;
    constructor(service: VideoRecordingsService);
    findAll(imei?: string, deviceId?: string, type?: RecordingType, status?: RecordingStatus, from?: string, to?: string, page?: string, limit?: string): Promise<{
        items: import("./video-recording.entity").VideoRecording[];
        total: number;
    }>;
    findOne(id: number): Promise<import("./video-recording.entity").VideoRecording & {
        videoUrl?: string;
        imageUrls?: string[];
    }>;
    remove(id: number): Promise<void>;
}
