import { GeofenceService } from './geofence.service';
export declare class GeofenceController {
    private geofenceService;
    constructor(geofenceService: GeofenceService);
    findAll(query: any): Promise<import("./geofence.entity").Geofence[]>;
    findOne(id: string): Promise<import("./geofence.entity").Geofence>;
    create(body: any, req: any): Promise<import("./geofence.entity").Geofence>;
    update(id: string, body: any): Promise<import("./geofence.entity").Geofence>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
