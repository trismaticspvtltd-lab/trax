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
exports.GeofenceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const geofence_entity_1 = require("./geofence.entity");
let GeofenceService = class GeofenceService {
    geofenceRepository;
    constructor(geofenceRepository) {
        this.geofenceRepository = geofenceRepository;
    }
    async findAll(filters) {
        const qb = this.geofenceRepository.createQueryBuilder('g');
        if (filters?.isActive !== undefined)
            qb.andWhere('g.isActive = :a', { a: filters.isActive === 'true' });
        return qb.orderBy('g.name', 'ASC').getMany();
    }
    async findOne(id) {
        const g = await this.geofenceRepository.findOne({ where: { id } });
        if (!g)
            throw new common_1.NotFoundException('Geofence not found');
        return g;
    }
    async create(data, userId) {
        const g = this.geofenceRepository.create({ ...data, createdBy: userId });
        return this.geofenceRepository.save(g);
    }
    async update(id, data) {
        await this.findOne(id);
        await this.geofenceRepository.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.findOne(id);
        await this.geofenceRepository.delete(id);
        return { message: 'Geofence deleted' };
    }
    isInsideCircle(lat, lng, centerLat, centerLng, radiusM) {
        const R = 6371000;
        const dLat = (lat - centerLat) * Math.PI / 180;
        const dLng = (lng - centerLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(centerLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return dist <= radiusM;
    }
    isInsidePolygon(lat, lng, polygon) {
        let inside = false;
        const n = polygon.length;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];
            const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
            if (intersect)
                inside = !inside;
        }
        return inside;
    }
    async checkGeofences(deviceId, lat, lng) {
        const geofences = await this.geofenceRepository.find({ where: { isActive: true } });
        const violations = [];
        for (const g of geofences) {
            if (g.assignedDevices && !g.assignedDevices.includes(deviceId))
                continue;
            let inside = false;
            if (g.type === geofence_entity_1.GeofenceType.CIRCLE) {
                const [cLat, cLng] = g.coordinates;
                inside = this.isInsideCircle(lat, lng, cLat, cLng, g.radius);
            }
            else if (g.type === geofence_entity_1.GeofenceType.POLYGON || g.type === geofence_entity_1.GeofenceType.RECTANGLE) {
                inside = this.isInsidePolygon(lat, lng, g.coordinates);
            }
            violations.push({ geofence: g, inside });
        }
        return violations;
    }
};
exports.GeofenceService = GeofenceService;
exports.GeofenceService = GeofenceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(geofence_entity_1.Geofence)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GeofenceService);
//# sourceMappingURL=geofence.service.js.map