"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const alert_entity_1 = require("./alert.entity");
let AlertsService = class AlertsService {
    alertRepository;
    constructor(alertRepository) {
        this.alertRepository = alertRepository;
    }
    async findAll(filters) {
        const where = {};
        if (filters?.deviceId)
            where.deviceId = +filters.deviceId;
        if (filters?.type)
            where.type = filters.type;
        if (filters?.severity)
            where.severity = filters.severity;
        if (filters?.isRead !== undefined)
            where.isRead = filters.isRead === 'true';
        if (filters?.isResolved !== undefined)
            where.isResolved = filters.isResolved === 'true';
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
    async create(data) {
        const alert = this.alertRepository.create(data);
        return this.alertRepository.save(alert);
    }
    async markAsRead(id) {
        await this.alertRepository.update(id, { isRead: true });
        return { message: 'Alert marked as read' };
    }
    async markAllAsRead(deviceId) {
        const where = { isRead: false };
        if (deviceId)
            where.deviceId = deviceId;
        await this.alertRepository.update(where, { isRead: true });
        return { message: 'All alerts marked as read' };
    }
    async resolve(id, userId) {
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
        const critical = await this.alertRepository.count({ where: { severity: alert_entity_1.AlertSeverity.CRITICAL, isRead: false } });
        const today = await this.alertRepository.count({
            where: {
                timestamp: (0, typeorm_2.Between)(new Date(new Date().setHours(0, 0, 0, 0)), new Date(new Date().setHours(23, 59, 59, 999))),
            },
        });
        return { total, unread, critical, today };
    }
    async getByDateRange(startDate, endDate, deviceId) {
        const where = { timestamp: (0, typeorm_2.Between)(startDate, endDate) };
        if (deviceId)
            where.deviceId = deviceId;
        return this.alertRepository.find({ where, order: { timestamp: 'DESC' } });
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(alert_entity_1.Alert)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map