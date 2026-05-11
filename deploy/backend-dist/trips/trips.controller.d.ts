import { TripsService } from './trips.service';
export declare class TripsController {
    private tripsService;
    constructor(tripsService: TripsService);
    findAll(query: any): Promise<{
        trips: import("./trip.entity").Trip[];
        total: number;
    }>;
    getStats(deviceId: string): Promise<{
        total: number;
        totalDistance: any;
        avgSpeed: any;
    }>;
    findOne(id: string): Promise<import("./trip.entity").Trip | null>;
}
