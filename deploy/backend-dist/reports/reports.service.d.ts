import { Repository } from 'typeorm';
import { Location } from '../tracking/location.entity';
import { Alert } from '../alerts/alert.entity';
import { Trip } from '../trips/trip.entity';
import { Device } from '../devices/device.entity';
export declare class ReportsService {
    private locationRepository;
    private alertRepository;
    private tripRepository;
    private deviceRepository;
    constructor(locationRepository: Repository<Location>, alertRepository: Repository<Alert>, tripRepository: Repository<Trip>, deviceRepository: Repository<Device>);
    getMileageReport(deviceId: number, startDate: Date, endDate: Date): Promise<{
        date: string;
        distance: number;
        points: number;
    }[]>;
    getSpeedReport(deviceId: number, startDate: Date, endDate: Date): Promise<{
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
    getAlertReport(deviceId: number, startDate: Date, endDate: Date): Promise<{
        total: number;
        byType: Record<string, number>;
        alerts: Alert[];
    }>;
    getTripReport(deviceId: number, startDate: Date, endDate: Date): Promise<{
        total: number;
        totalDistance: number;
        totalDuration: number;
        avgSpeed: number;
        trips: Trip[];
    }>;
    getFleetSummary(startDate: Date, endDate: Date): Promise<any[]>;
    private calcDistance;
}
