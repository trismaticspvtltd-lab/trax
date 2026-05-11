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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alert = exports.AlertSeverity = exports.AlertType = void 0;
const typeorm_1 = require("typeorm");
var AlertType;
(function (AlertType) {
    AlertType["SPEEDING"] = "speeding";
    AlertType["GEOFENCE_ENTER"] = "geofence_enter";
    AlertType["GEOFENCE_EXIT"] = "geofence_exit";
    AlertType["SOS"] = "sos";
    AlertType["POWER_CUT"] = "power_cut";
    AlertType["LOW_BATTERY"] = "low_battery";
    AlertType["HARSH_BRAKING"] = "harsh_braking";
    AlertType["HARSH_ACCELERATION"] = "harsh_acceleration";
    AlertType["HARSH_CORNERING"] = "harsh_cornering";
    AlertType["COLLISION"] = "collision";
    AlertType["ROLLOVER"] = "rollover";
    AlertType["FATIGUE_DRIVING"] = "fatigue_driving";
    AlertType["LANE_DEPARTURE"] = "lane_departure";
    AlertType["FORWARD_COLLISION"] = "forward_collision";
    AlertType["ADAS_PCW"] = "adas_pcw";
    AlertType["ADAS_BSM"] = "adas_bsm";
    AlertType["DMS_FATIGUE"] = "dms_fatigue";
    AlertType["DMS_DISTRACTION"] = "dms_distraction";
    AlertType["DMS_PHONE"] = "dms_phone";
    AlertType["DMS_SMOKING"] = "dms_smoking";
    AlertType["VEHICLE_THEFT"] = "vehicle_theft";
    AlertType["UNAUTHORIZED_IGNITION"] = "unauthorized_ignition";
    AlertType["GNSS_FAULT"] = "gnss_fault";
    AlertType["ENGINE_ON"] = "engine_on";
    AlertType["ENGINE_OFF"] = "engine_off";
    AlertType["DEVICE_OFFLINE"] = "device_offline";
    AlertType["TAMPERING"] = "tampering";
    AlertType["OTHER"] = "other";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "low";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
let Alert = class Alert {
    id;
    deviceId;
    imei;
    deviceName;
    type;
    severity;
    message;
    latitude;
    longitude;
    speed;
    geofenceId;
    geofenceName;
    isRead;
    isResolved;
    resolvedBy;
    resolvedAt;
    extraData;
    timestamp;
    createdAt;
};
exports.Alert = Alert;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Alert.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Alert.prototype, "deviceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Alert.prototype, "imei", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Alert.prototype, "deviceName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AlertType }),
    __metadata("design:type", String)
], Alert.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AlertSeverity, default: AlertSeverity.MEDIUM }),
    __metadata("design:type", String)
], Alert.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Alert.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Alert.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Alert.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Alert.prototype, "speed", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Alert.prototype, "geofenceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Alert.prototype, "geofenceName", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Alert.prototype, "isRead", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Alert.prototype, "isResolved", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Alert.prototype, "resolvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Alert.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Alert.prototype, "extraData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], Alert.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Alert.prototype, "createdAt", void 0);
exports.Alert = Alert = __decorate([
    (0, typeorm_1.Entity)('alerts')
], Alert);
//# sourceMappingURL=alert.entity.js.map