import { Repository } from 'typeorm';
import { Location } from './location.entity';
import { TrackingGateway } from './tracking.gateway';
import { DevicesService } from '../devices/devices.service';
import { AlertsService } from '../alerts/alerts.service';
export declare class TrackingService {
    private locationRepository;
    private trackingGateway;
    private devicesService;
    private alertsService;
    constructor(locationRepository: Repository<Location>, trackingGateway: TrackingGateway, devicesService: DevicesService, alertsService: AlertsService);
    processLocationUpdate(imei: string, locationData: any): Promise<Location | null>;
    private processAlarms;
    getHistory(deviceId: number, startDate: Date, endDate: Date): Promise<Location[]>;
    getLatestLocation(deviceId: number): Promise<Location | null>;
    getLocationsByTrip(tripId: number): Promise<Location[]>;
    getDailyMileage(deviceId: number, date: Date): Promise<number>;
    calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
}
