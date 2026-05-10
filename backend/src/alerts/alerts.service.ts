import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Alert, AlertType, AlertSeverity } from './alert.entity';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
  ) {}

  async findAll(filters?: any) {
    const where: FindOptionsWhere<Alert> = {};
    if (filters?.deviceId) where.deviceId = +filters.deviceId;
    if (filters?.type) where.type = filters.type;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.isRead !== undefined) where.isRead = filters.isRead === 'true';
    if (filters?.isResolved !== undefined) where.isResolved = filters.isResolved === 'true';

    const take = filters?.limit ? +filters.limit : 50;
    const skip = filters?.offset ? +filters.offset : 0;

    const [alerts, total] = await this.alertRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      take,
      skip,
    });
    return { alerts, total };
  }

  async create(data: Partial<Alert>) {
    const alert = this.alertRepository.create(data);
    return this.alertRepository.save(alert);
  }

  async markAsRead(id: number) {
    await this.alertRepository.update(id, { isRead: true });
    return { message: 'Alert marked as read' };
  }

  async markAllAsRead(deviceId?: number) {
    const where: any = { isRead: false };
    if (deviceId) where.deviceId = deviceId;
    await this.alertRepository.update(where, { isRead: true });
    return { message: 'All alerts marked as read' };
  }

  async resolve(id: number, userId: number) {
    await this.alertRepository.update(id, {
      isResolved: true,
      resolvedBy: userId,
      resolvedAt: new Date(),
    });
    return { message: 'Alert resolved' };
  }

  async getUnreadCount() {
    return this.alertRepository.count({ where: { isRead: false } });
  }

  async getStats() {
    const total = await this.alertRepository.count();
    const unread = await this.alertRepository.count({ where: { isRead: false } });
    const critical = await this.alertRepository.count({ where: { severity: AlertSeverity.CRITICAL, isRead: false } });
    const today = await this.alertRepository.count({
      where: {
        timestamp: Between(
          new Date(new Date().setHours(0, 0, 0, 0)),
          new Date(new Date().setHours(23, 59, 59, 999)),
        ),
      },
    });
    return { total, unread, critical, today };
  }

  async getByDateRange(startDate: Date, endDate: Date, deviceId?: number) {
    const where: any = { timestamp: Between(startDate, endDate) };
    if (deviceId) where.deviceId = deviceId;
    return this.alertRepository.find({ where, order: { timestamp: 'DESC' } });
  }
}
