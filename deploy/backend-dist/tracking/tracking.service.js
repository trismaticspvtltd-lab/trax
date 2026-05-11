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
exports.TrackingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const location_entity_1 = require("./location.entity");
const tracking_gateway_1 = require("./tracking.gateway");
const devices_service_1 = require("../devices/devices.service");
const alerts_service_1 = require("../alerts/alerts.service");
const device_entity_1 = require("../devices/device.entity");
const alert_entity_1 = require("../alerts/alert.entity");
let TrackingService = class TrackingService {
    locationRepository;
    trackingGateway;
    devicesService;
    alertsService;
    constructor(locationRepository, trackingGateway, devicesService, alertsService) {
        this.locationRepository = locationRepository;
        this.trackingGateway = trackingGateway;
        this.devicesService = devicesService;
        this.alertsService = alertsService;
    }
    async processLocationUpdate(imei, locationData) {
        const device = await this.devicesService.findByImei(imei);
        if (!device)
            return null;
        const location = this.locationRepository.create({
            deviceId: device.id,
            imei,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            speed: locationData.speed || 0,
            heading: locationData.heading || 0,
            altitude: locationData.altitude || 0,
            satellites: locationData.satellites,
            accuracy: locationData.accuracy,
            engineOn: locationData.engineOn || false,
            gpsValid: locationData.gpsValid !== false,
            alarmFlags: locationData.alarmFlags,
            statusFlags: locationData.statusFlags,
            mileage: locationData.mileage,
            fuelLevel: locationData.fuelLevel,
            timestamp: locationData.timestamp || new Date(),
        });
        await this.locationRepository.save(location);
        const status = locationData.speed > 5
            ? device_entity_1.DeviceStatus.MOVING
            : locationData.engineOn ? device_entity_1.DeviceStatus.IDLE : device_entity_1.DeviceStatus.STOPPED;
        const updatedDevice = await this.devicesService.updateLocation(imei, {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            speed: locationData.speed,
            heading: locationData.heading,
            altitude: locationData.altitude,
            engineOn: locationData.engineOn,
            status,
            odometer: locationData.mileage,
            fuelLevel: locationData.fuelLevel,
        });
        const payload = {
            deviceId: device.id,
            imei,
            name: device.name,
            plateNumber: device.plateNumber,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            speed: locationData.speed,
            heading: locationData.heading,
            status,
            engineOn: locationData.engineOn,
            timestamp: location.timestamp,
            alarmFlags: locationData.alarmFlags,
        };
        this.trackingGateway.emitLocationUpdate(device.id, payload);
        if (locationData.alarmFlags) {
            await this.processAlarms(device, locationData);
        }
        return location;
    }
    async processAlarms(device, locationData) {
        const flags = locationData.alarmFlags;
        const spd = Math.round(locationData.speed || 0);
        const alertMap = [
            { flag: 'sos', type: alert_entity_1.AlertType.SOS, severity: alert_entity_1.AlertSeverity.CRITICAL, msg: 'SOS Emergency triggered' },
            { flag: 'overSpeed', type: alert_entity_1.AlertType.SPEEDING, severity: alert_entity_1.AlertSeverity.HIGH, msg: `Speeding: ${spd} km/h` },
            { flag: 'powerCut', type: alert_entity_1.AlertType.POWER_CUT, severity: alert_entity_1.AlertSeverity.CRITICAL, msg: 'External power cut detected' },
            { flag: 'collision', type: alert_entity_1.AlertType.COLLISION, severity: alert_entity_1.AlertSeverity.CRITICAL, msg: 'Collision detected' },
            { flag: 'rollover', type: alert_entity_1.AlertType.ROLLOVER, severity: alert_entity_1.AlertSeverity.CRITICAL, msg: 'Vehicle rollover detected' },
            { flag: 'fatigue', type: alert_entity_1.AlertType.FATIGUE_DRIVING, severity: alert_entity_1.AlertSeverity.HIGH, msg: 'Fatigue driving (standard)' },
            { flag: 'vehicleTheft', type: alert_entity_1.AlertType.VEHICLE_THEFT, severity: alert_entity_1.AlertSeverity.CRITICAL, msg: 'Vehicle theft alarm' },
            { flag: 'illegalIgnition', type: alert_entity_1.AlertType.UNAUTHORIZED_IGNITION, severity: alert_entity_1.AlertSeverity.HIGH, msg: 'Unauthorized ignition detected' },
            { flag: 'gnssFault', type: alert_entity_1.AlertType.GNSS_FAULT, severity: alert_entity_1.AlertSeverity.MEDIUM, msg: 'GNSS module fault' },
            { flag: 'adasFCW', type: alert_entity_1.AlertType.FORWARD_COLLISION, severity: alert_entity_1.AlertSeverity.CRITICAL, msg: 'ADAS: Forward Collision Warning' },
            { flag: 'adasLDW', type: alert_entity_1.AlertType.LANE_DEPARTURE, severity: alert_entity_1.AlertSeverity.HIGH, msg: 'ADAS: Lane Departure Warning' },
            { flag: 'adasPCW', type: alert_entity_1.AlertType.ADAS_PCW, severity: alert_entity_1.AlertSeverity.CRITICAL, msg: 'ADAS: Pedestrian Collision Warning' },
            { flag: 'adasBSM', type: alert_entity_1.AlertType.ADAS_BSM, severity: alert_entity_1.AlertSeverity.HIGH, msg: 'ADAS: Blind Spot Monitoring alert' },
            { flag: 'dmsFatigue', type: alert_entity_1.AlertType.DMS_FATIGUE, severity: alert_entity_1.AlertSeverity.HIGH, msg: 'DMS: Driver fatigue detected' },
            { flag: 'dmsDistraction', type: alert_entity_1.AlertType.DMS_DISTRACTION, severity: alert_entity_1.AlertSeverity.HIGH, msg: 'DMS: Driver distraction detected' },
            { flag: 'dmsPhone', type: alert_entity_1.AlertType.DMS_PHONE, severity: alert_entity_1.AlertSeverity.HIGH, msg: 'DMS: Phone use while driving' },
            { flag: 'dmsSmoking', type: alert_entity_1.AlertType.DMS_SMOKING, severity: alert_entity_1.AlertSeverity.MEDIUM, msg: 'DMS: Smoking while driving' },
        ];
        for (const { flag, type, severity, msg } of alertMap) {
            if (flags[flag]) {
                const alert = await this.alertsService.create({
                    deviceId: device.id,
                    imei: device.imei,
                    deviceName: device.name,
                    type,
                    severity,
                    message: msg,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                    speed: locationData.speed,
                    timestamp: locationData.timestamp || new Date(),
                });
                this.trackingGateway.emitAlert(alert);
            }
        }
    }
    async getHistory(deviceId, startDate, endDate) {
        return this.locationRepository.find({
            where: {
                deviceId,
                timestamp: (0, typeorm_2.Between)(startDate, endDate),
            },
            order: { timestamp: 'ASC' },
        });
    }
    async getLatestLocation(deviceId) {
        return this.locationRepository.findOne({
            where: { deviceId },
            order: { timestamp: 'DESC' },
        });
    }
    async getLocationsByTrip(tripId) {
        return this.locationRepository.find({
            where: { tripId },
            order: { timestamp: 'ASC' },
        });
    }
    async getDailyMileage(deviceId, date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        const locations = await this.getHistory(deviceId, start, end);
        if (locations.length < 2)
            return 0;
        let distance = 0;
        for (let i = 1; i < locations.length; i++) {
            distance += this.calcDistance(+locations[i - 1].latitude, +locations[i - 1].longitude, +locations[i].latitude, +locations[i].longitude);
        }
        return Math.round(distance * 100) / 100;
    }
    calcDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
};
exports.TrackingService = TrackingService;
exports.TrackingService = TrackingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(location_entity_1.Location)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        tracking_gateway_1.TrackingGateway,
        devices_service_1.DevicesService,
        alerts_service_1.AlertsService])
], TrackingService);
//# sourceMappingURL=tracking.service.js.map