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
exports.Device = exports.VehicleType = exports.DeviceStatus = void 0;
const typeorm_1 = require("typeorm");
var DeviceStatus;
(function (DeviceStatus) {
    DeviceStatus["ONLINE"] = "online";
    DeviceStatus["OFFLINE"] = "offline";
    DeviceStatus["MOVING"] = "moving";
    DeviceStatus["IDLE"] = "idle";
    DeviceStatus["STOPPED"] = "stopped";
    DeviceStatus["ALARM"] = "alarm";
})(DeviceStatus || (exports.DeviceStatus = DeviceStatus = {}));
var VehicleType;
(function (VehicleType) {
    VehicleType["CAR"] = "car";
    VehicleType["TRUCK"] = "truck";
    VehicleType["BUS"] = "bus";
    VehicleType["MOTORCYCLE"] = "motorcycle";
    VehicleType["VAN"] = "van";
    VehicleType["OTHER"] = "other";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
let Device = class Device {
    id;
    imei;
    simNumber;
    name;
    plateNumber;
    vehicleType;
    status;
    latitude;
    longitude;
    speed;
    heading;
    altitude;
    lastUpdate;
    lastOnline;
    driverName;
    driverId;
    groupId;
    groupName;
    isActive;
    alarmFlags;
    odometer;
    fuelLevel;
    engineOn;
    iconColor;
    model;
    protocolVersion;
    createdAt;
    updatedAt;
};
exports.Device = Device;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Device.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Device.prototype, "imei", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    __metadata("design:type", String)
], Device.prototype, "simNumber", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Device.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Device.prototype, "plateNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: VehicleType, default: VehicleType.CAR }),
    __metadata("design:type", String)
], Device.prototype, "vehicleType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DeviceStatus, default: DeviceStatus.OFFLINE }),
    __metadata("design:type", String)
], Device.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Device.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Device.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Device.prototype, "speed", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Device.prototype, "heading", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Device.prototype, "altitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Device.prototype, "lastUpdate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Device.prototype, "lastOnline", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Device.prototype, "driverName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Device.prototype, "driverId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Device.prototype, "groupId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Device.prototype, "groupName", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Device.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Device.prototype, "alarmFlags", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Device.prototype, "odometer", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Device.prototype, "fuelLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Boolean)
], Device.prototype, "engineOn", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Device.prototype, "iconColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Device.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Device.prototype, "protocolVersion", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Device.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Device.prototype, "updatedAt", void 0);
exports.Device = Device = __decorate([
    (0, typeorm_1.Entity)('devices')
], Device);
//# sourceMappingURL=device.entity.js.map