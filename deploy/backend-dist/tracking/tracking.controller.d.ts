import { TrackingService } from './tracking.service';
export declare class TrackingController {
    private trackingService;
    constructor(trackingService: TrackingService);
    getHistory(deviceId: string, start: string, end: string): Promise<import("./location.entity").Location[]>;
    getLatest(deviceId: string): Promise<import("./location.entity").Location | null>;
    getMileage(deviceId: string, date: string): Promise<number>;
}
