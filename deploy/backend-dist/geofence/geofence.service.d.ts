import { Repository } from 'typeorm';
import { Geofence } from './geofence.entity';
export declare class GeofenceService {
    private geofenceRepository;
    constructor(geofenceRepository: Repository<Geofence>);
    findAll(filters?: any): Promise<Geofence[]>;
    findOne(id: number): Promise<Geofence>;
    create(data: Partial<Geofence>, userId: number): Promise<Geofence>;
    update(id: number, data: Partial<Geofence>): Promise<Geofence>;
    remove(id: number): Promise<{
        message: string;
    }>;
    isInsideCircle(lat: number, lng: number, centerLat: number, centerLng: number, radiusM: number): boolean;
    isInsidePolygon(lat: number, lng: number, polygon: [number, number][]): boolean;
    checkGeofences(deviceId: number, lat: number, lng: number): Promise<{
        geofence: Geofence;
        inside: boolean;
    }[]>;
}
