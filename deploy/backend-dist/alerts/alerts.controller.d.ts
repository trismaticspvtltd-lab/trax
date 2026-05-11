import { AlertsService } from './alerts.service';
export declare class AlertsController {
    private alertsService;
    constructor(alertsService: AlertsService);
    findAll(query: any): Promise<{
        alerts: import("./alert.entity").Alert[];
        total: number;
    }>;
    getStats(): Promise<{
        total: number;
        unread: number;
        critical: number;
        today: number;
    }>;
    getUnreadCount(): Promise<number>;
    markAllAsRead(deviceId: string): Promise<{
        message: string;
    }>;
    markAsRead(id: string): Promise<{
        message: string;
    }>;
    resolve(id: string, req: any): Promise<{
        message: string;
    }>;
}
