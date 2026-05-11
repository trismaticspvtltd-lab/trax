import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { VideoRecordingsService } from '../video-recordings/video-recordings.service';
import { MediaServerGateway } from './media-server.gateway';
import { S3Service } from '../s3/s3.service';
export declare class MediaServerService implements OnModuleInit, OnModuleDestroy {
    private videoRecordingsService;
    private gateway;
    private s3;
    private readonly logger;
    private server;
    private sessions;
    private readonly ALARM_DURATION_SEC;
    constructor(videoRecordingsService: VideoRecordingsService, gateway: MediaServerGateway, s3: S3Service);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private startMediaServer;
    private handleMediaConnection;
    private processMediaBuffer;
    private handlePacket;
    private startRecordingTimer;
    private startFfmpegPipe;
    private finalizeSession;
    private saveRawH264;
    getActiveStreams(): {
        simNumber: string;
        channel: number;
        started: Date;
        isRecording: boolean;
    }[];
    forceStopStream(imei: string, channel?: number): boolean;
}
