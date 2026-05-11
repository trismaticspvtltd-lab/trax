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
exports.TripsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const trip_entity_1 = require("./trip.entity");
let TripsService = class TripsService {
    tripRepository;
    constructor(tripRepository) {
        this.tripRepository = tripRepository;
    }
    async findAll(filters) {
        const where = {};
        if (filters?.deviceId)
            where.deviceId = +filters.deviceId;
        if (filters?.status)
            where.status = filters.status;
        const take = filters?.limit ? +filters.limit : 50;
        const skip = filters?.offset ? +filters.offset : 0;
        if (filters?.startDate && filters?.endDate) {
            where.startTime = (0, typeorm_2.Between)(new Date(filters.startDate), new Date(filters.endDate));
        }
        const [trips, total] = await this.tripRepository.findAndCount({
            where,
            order: { startTime: 'DESC' },
            take,
            skip,
        });
        return { trips, total };
    }
    async findOne(id) {
        return this.tripRepository.findOne({ where: { id } });
    }
    async startTrip(deviceId, imei, lat, lng, driverId, driverName) {
        const existing = await this.tripRepository.findOne({
            where: { deviceId, status: trip_entity_1.TripStatus.ACTIVE },
        });
        if (existing)
            return existing;
        const trip = this.tripRepository.create({
            deviceId,
            imei,
            driverId,
            driverName,
            status: trip_entity_1.TripStatus.ACTIVE,
            startTime: new Date(),
            startLat: lat,
            startLng: lng,
        });
        return this.tripRepository.save(trip);
    }
    async endTrip(deviceId, lat, lng, distance, maxSpeed, avgSpeed) {
        const trip = await this.tripRepository.findOne({
            where: { deviceId, status: trip_entity_1.TripStatus.ACTIVE },
            order: { startTime: 'DESC' },
        });
        if (!trip)
            return null;
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - trip.startTime.getTime()) / 1000);
        await this.tripRepository.update(trip.id, {
            status: trip_entity_1.TripStatus.COMPLETED,
            endTime,
            endLat: lat,
            endLng: lng,
            distance,
            maxSpeed,
            avgSpeed,
            duration,
        });
        return this.findOne(trip.id);
    }
    async getStats(deviceId) {
        const qb = this.tripRepository.createQueryBuilder('t');
        if (deviceId)
            qb.where('t.deviceId = :deviceId', { deviceId });
        const total = await qb.getCount();
        const totalDistance = await qb.select('SUM(t.distance)', 'total').getRawOne();
        const avgSpeed = await qb.select('AVG(t.avgSpeed)', 'avg').getRawOne();
        return {
            total,
            totalDistance: totalDistance?.total || 0,
            avgSpeed: avgSpeed?.avg || 0,
        };
    }
    async getByDateRange(startDate, endDate, deviceId) {
        const where = { startTime: (0, typeorm_2.Between)(startDate, endDate) };
        if (deviceId)
            where.deviceId = deviceId;
        return this.tripRepository.find({ where, order: { startTime: 'DESC' } });
    }
};
exports.TripsService = TripsService;
exports.TripsService = TripsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(trip_entity_1.Trip)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TripsService);
//# sourceMappingURL=trips.service.js.map