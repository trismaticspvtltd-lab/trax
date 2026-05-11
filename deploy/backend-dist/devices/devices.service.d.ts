import { Repository } from 'typeorm';
import { Device } from './device.entity';
export declare class DevicesService {
    private deviceRepository;
    constructor(deviceRepository: Repository<Device>);
    findAll(filters?: any): Promise<Device[]>;
    findOne(id: number): Promise<Device>;
    findByImei(imei: string): Promise<Device | null>;
    create(data: Partial<Device>): Promise<Device>;
    update(id: number, data: Partial<Device>): Promise<Device>;
    updateLocation(imei: string, locationData: Partial<Device>): Promise<Device | null>;
    remove(id: number): Promise<{
        message: string;
    }>;
    getStats(): Promise<{
        total: number;
        online: number;
        moving: number;
        offline: number;
        idle: number;
    }>;
    setOffline(imei: string): Promise<void>;
    updateByImei(imei: string, data: Partial<Device>): Promise<Device | null>;
}
