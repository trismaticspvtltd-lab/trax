import { Repository } from 'typeorm';
import { Alert } from './alert.entity';
export declare class AlertsService {
    private alertRepository;
    constructor(alertRepository: Repository<Alert>);
    findAll(filters?: any): Promise<{
        alerts: Alert[];
        total: number;
    }>;
    create(data: Partial<Alert>): Promise<Alert>;
    markAsRead(id: number): Promise<{
        message: string;
    }>;
    markAllAsRead(deviceId?: number): Promise<{
        message: string;
    }>;
    resolve(id: number, userId: number): Promise<{
        message: string;
    }>;
    getUnreadCount(): Promise<number>;
    getStats(): Promise<{
        total: number;
        unread: number;
        critical: number;
        today: number;
    }>;
    getByDateRange(startDate: Date, endDate: Date, deviceId?: number): Promise<Alert[]>;
}
