import { Repository } from 'typeorm';
import { Trip } from './trip.entity';
export declare class TripsService {
    private tripRepository;
    constructor(tripRepository: Repository<Trip>);
    findAll(filters?: any): Promise<{
        trips: Trip[];
        total: number;
    }>;
    findOne(id: number): Promise<Trip | null>;
    startTrip(deviceId: number, imei: string, lat: number, lng: number, driverId?: number, driverName?: string): Promise<Trip>;
    endTrip(deviceId: number, lat: number, lng: number, distance: number, maxSpeed: number, avgSpeed: number): Promise<Trip | null>;
    getStats(deviceId?: number): Promise<{
        total: number;
        totalDistance: any;
        avgSpeed: any;
    }>;
    getByDateRange(startDate: Date, endDate: Date, deviceId?: number): Promise<Trip[]>;
}
