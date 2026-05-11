import { MediaServerService } from './media-server.service';
export declare class MediaServerController {
    private readonly mediaServerService;
    constructor(mediaServerService: MediaServerService);
    getActiveStreams(): {
        simNumber: string;
        channel: number;
        started: Date;
        isRecording: boolean;
    }[];
    stopStream(imei: string): {
        success: boolean;
    };
}
