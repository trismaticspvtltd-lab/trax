import { ReportsService } from './reports.service';
export declare class ReportsController {
    private reportsService;
    constructor(reportsService: ReportsService);
    getMileage(deviceId: string, start: string, end: string): Promise<{
        date: string;
        distance: number;
        points: number;
    }[]>;
    getSpeed(deviceId: string, start: string, end: string): Promise<{
        maxSpeed: number;
        avgSpeed: number;
        speedingEvents: {
            timestamp: Date;
            speed: number;
            latitude: number;
            longitude: number;
        }[];
        speedHistory: {
            timestamp: Date;
            speed: number;
            latitude: number;
            longitude: number;
        }[];
    }>;
    getAlerts(deviceId: string, start: string, end: string): Promise<{
        total: number;
        byType: Record<string, number>;
        alerts: import("../alerts/alert.entity").Alert[];
    }>;
    getTrips(deviceId: string, start: string, end: string): Promise<{
        total: number;
        totalDistance: number;
        totalDuration: number;
        avgSpeed: number;
        trips: import("../trips/trip.entity").Trip[];
    }>;
    getFleet(start: string, end: string): Promise<any[]>;
}
