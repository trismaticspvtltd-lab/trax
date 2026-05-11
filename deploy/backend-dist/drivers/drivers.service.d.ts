import { Repository } from 'typeorm';
import { Driver } from './driver.entity';
export declare class DriversService {
    private driverRepository;
    constructor(driverRepository: Repository<Driver>);
    findAll(): Promise<Driver[]>;
    findOne(id: number): Promise<Driver>;
    create(data: Partial<Driver>): Promise<Driver>;
    update(id: number, data: Partial<Driver>): Promise<Driver>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
