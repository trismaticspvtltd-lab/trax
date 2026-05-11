import { DriversService } from './drivers.service';
export declare class DriversController {
    private driversService;
    constructor(driversService: DriversService);
    findAll(): Promise<import("./driver.entity").Driver[]>;
    findOne(id: string): Promise<import("./driver.entity").Driver>;
    create(body: any): Promise<import("./driver.entity").Driver>;
    update(id: string, body: any): Promise<import("./driver.entity").Driver>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
