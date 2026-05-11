import { DevicesService } from './devices.service';
export declare class DevicesController {
    private devicesService;
    constructor(devicesService: DevicesService);
    findAll(query: any): Promise<import("./device.entity").Device[]>;
    getStats(): Promise<{
        total: number;
        online: number;
        moving: number;
        offline: number;
        idle: number;
    }>;
    findOne(id: string): Promise<import("./device.entity").Device>;
    create(body: any): Promise<import("./device.entity").Device>;
    update(id: string, body: any): Promise<import("./device.entity").Device>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
