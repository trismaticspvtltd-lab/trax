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
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const device_entity_1 = require("./device.entity");
let DevicesService = class DevicesService {
    deviceRepository;
    constructor(deviceRepository) {
        this.deviceRepository = deviceRepository;
    }
    async findAll(filters) {
        const qb = this.deviceRepository.createQueryBuilder('d');
        if (filters?.status)
            qb.andWhere('d.status = :status', { status: filters.status });
        if (filters?.groupId)
            qb.andWhere('d.groupId = :groupId', { groupId: filters.groupId });
        if (filters?.search) {
            qb.andWhere('(d.name LIKE :s OR d.imei LIKE :s OR d.plateNumber LIKE :s)', { s: `%${filters.search}%` });
        }
        return qb.orderBy('d.name', 'ASC').getMany();
    }
    async findOne(id) {
        const device = await this.deviceRepository.findOne({ where: { id } });
        if (!device)
            throw new common_1.NotFoundException('Device not found');
        return device;
    }
    async findByImei(imei) {
        return this.deviceRepository.findOne({ where: { imei } });
    }
    async create(data) {
        const device = this.deviceRepository.create(data);
        return this.deviceRepository.save(device);
    }
    async update(id, data) {
        await this.findOne(id);
        await this.deviceRepository.update(id, data);
        return this.findOne(id);
    }
    async updateLocation(imei, locationData) {
        const device = await this.findByImei(imei);
        if (!device)
            return null;
        await this.deviceRepository.update(device.id, {
            ...locationData,
            lastUpdate: new Date(),
            lastOnline: new Date(),
        });
        return this.deviceRepository.findOne({ where: { id: device.id } });
    }
    async remove(id) {
        await this.findOne(id);
        await this.deviceRepository.update(id, { isActive: false });
        return { message: 'Device deactivated' };
    }
    async getStats() {
        const total = await this.deviceRepository.count({ where: { isActive: true } });
        const online = await this.deviceRepository.count({ where: { status: device_entity_1.DeviceStatus.ONLINE, isActive: true } });
        const moving = await this.deviceRepository.count({ where: { status: device_entity_1.DeviceStatus.MOVING, isActive: true } });
        const offline = await this.deviceRepository.count({ where: { status: device_entity_1.DeviceStatus.OFFLINE, isActive: true } });
        const idle = await this.deviceRepository.count({ where: { status: device_entity_1.DeviceStatus.IDLE, isActive: true } });
        return { total, online, moving, offline, idle };
    }
    async setOffline(imei) {
        const device = await this.findByImei(imei);
        if (device) {
            await this.deviceRepository.update(device.id, { status: device_entity_1.DeviceStatus.OFFLINE });
        }
    }
    async updateByImei(imei, data) {
        const device = await this.findByImei(imei);
        if (!device)
            return null;
        await this.deviceRepository.update(device.id, data);
        return this.deviceRepository.findOne({ where: { id: device.id } });
    }
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(device_entity_1.Device)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DevicesService);
//# sourceMappingURL=devices.service.js.map