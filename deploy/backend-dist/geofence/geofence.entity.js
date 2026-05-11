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
exports.Geofence = exports.GeofenceType = void 0;
const typeorm_1 = require("typeorm");
var GeofenceType;
(function (GeofenceType) {
    GeofenceType["CIRCLE"] = "circle";
    GeofenceType["POLYGON"] = "polygon";
    GeofenceType["RECTANGLE"] = "rectangle";
})(GeofenceType || (exports.GeofenceType = GeofenceType = {}));
let Geofence = class Geofence {
    id;
    name;
    description;
    type;
    coordinates;
    radius;
    color;
    alertOnEnter;
    alertOnExit;
    isActive;
    assignedDevices;
    createdBy;
    createdAt;
    updatedAt;
};
exports.Geofence = Geofence;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Geofence.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Geofence.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Geofence.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: GeofenceType, default: GeofenceType.CIRCLE }),
    __metadata("design:type", String)
], Geofence.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Object)
], Geofence.prototype, "coordinates", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Geofence.prototype, "radius", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '#FF5733' }),
    __metadata("design:type", String)
], Geofence.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Geofence.prototype, "alertOnEnter", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Geofence.prototype, "alertOnExit", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Geofence.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], Geofence.prototype, "assignedDevices", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Geofence.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Geofence.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Geofence.prototype, "updatedAt", void 0);
exports.Geofence = Geofence = __decorate([
    (0, typeorm_1.Entity)('geofences')
], Geofence);
//# sourceMappingURL=geofence.entity.js.map