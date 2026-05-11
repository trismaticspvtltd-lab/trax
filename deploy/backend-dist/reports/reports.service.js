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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const location_entity_1 = require("../tracking/location.entity");
const alert_entity_1 = require("../alerts/alert.entity");
const trip_entity_1 = require("../trips/trip.entity");
const device_entity_1 = require("../devices/device.entity");
let ReportsService = class ReportsService {
    locationRepository;
    alertRepository;
    tripRepository;
    deviceRepository;
    constructor(locationRepository, alertRepository, tripRepository, deviceRepository) {
        this.locationRepository = locationRepository;
        this.alertRepository = alertRepository;
        this.tripRepository = tripRepository;
        this.deviceRepository = deviceRepository;
    }
    async getMileageReport(deviceId, startDate, endDate) {
        const locations = await this.locationRepository.find({
            where: { deviceId, timestamp: (0, typeorm_2.Between)(startDate, endDate) },
            order: { timestamp: 'ASC' },
        });
        const dailyMap = new Map();
        for (let i = 1; i < locations.length; i++) {
            const date = locations[i].timestamp.toISOString().split('T')[0];
            if (!dailyMap.has(date))
                dailyMap.set(date, { distance: 0, locations: [] });
            const entry = dailyMap.get(date);
            entry.distance += this.calcDistance(+locations[i - 1].latitude, +locations[i - 1].longitude, +locations[i].latitude, +locations[i].longitude);
            entry.locations.push(locations[i]);
        }
        const result = [];
        for (const [date, data] of dailyMap) {
            result.push({ date, distance: Math.round(data.distance * 100) / 100, points: data.locations.length });
        }
        return result.sort((a, b) => a.date.localeCompare(b.date));
    }
    async getSpeedReport(deviceId, startDate, endDate) {
        const locations = await this.locationRepository.find({
            where: { deviceId, timestamp: (0, typeorm_2.Between)(startDate, endDate) },
            order: { timestamp: 'ASC' },
        });
        const speedEvents = locations
            .filter(l => l.speed > 0)
            .map(l => ({
            timestamp: l.timestamp,
            speed: l.speed,
            latitude: l.latitude,
            longitude: l.longitude,
        }));
        const maxSpeed = Math.max(...speedEvents.map(e => e.speed), 0);
        const avgSpeed = speedEvents.length ? speedEvents.reduce((s, e) => s + +e.speed, 0) / speedEvents.length : 0;
        const speedingEvents = speedEvents.filter(e => +e.speed > 80);
        return { maxSpeed, avgSpeed: Math.round(avgSpeed * 10) / 10, speedingEvents, speedHistory: speedEvents };
    }
    async getAlertReport(deviceId, startDate, endDate) {
        const alerts = await this.alertRepository.find({
            where: { deviceId, timestamp: (0, typeorm_2.Between)(startDate, endDate) },
            order: { timestamp: 'DESC' },
        });
        const byType = alerts.reduce((acc, a) => {
            acc[a.type] = (acc[a.type] || 0) + 1;
            return acc;
        }, {});
        return { total: alerts.length, byType, alerts };
    }
    async getTripReport(deviceId, startDate, endDate) {
        const trips = await this.tripRepository.find({
            where: { deviceId, startTime: (0, typeorm_2.Between)(startDate, endDate) },
            order: { startTime: 'DESC' },
        });
        const totalDistance = trips.reduce((s, t) => s + +t.distance, 0);
        const totalDuration = trips.reduce((s, t) => s + (t.duration || 0), 0);
        const avgSpeed = trips.length ? trips.reduce((s, t) => s + +t.avgSpeed, 0) / trips.length : 0;
        return {
            total: trips.length,
            totalDistance: Math.round(totalDistance * 100) / 100,
            totalDuration,
            avgSpeed: Math.round(avgSpeed * 10) / 10,
            trips,
        };
    }
    async getFleetSummary(startDate, endDate) {
        const devices = await this.deviceRepository.find({ where: { isActive: true } });
        const summary = [];
        for (const device of devices) {
            const trips = await this.tripRepository.find({
                where: { deviceId: device.id, startTime: (0, typeorm_2.Between)(startDate, endDate) },
            });
            const alerts = await this.alertRepository.count({
                where: { deviceId: device.id, timestamp: (0, typeorm_2.Between)(startDate, endDate) },
            });
            const distance = trips.reduce((s, t) => s + +t.distance, 0);
            summary.push({
                device: { id: device.id, name: device.name, plateNumber: device.plateNumber },
                trips: trips.length,
                distance: Math.round(distance * 100) / 100,
                alerts,
            });
        }
        return summary;
    }
    calcDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(location_entity_1.Location)),
    __param(1, (0, typeorm_1.InjectRepository)(alert_entity_1.Alert)),
    __param(2, (0, typeorm_1.InjectRepository)(trip_entity_1.Trip)),
    __param(3, (0, typeorm_1.InjectRepository)(device_entity_1.Device)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map