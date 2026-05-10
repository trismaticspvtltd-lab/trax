import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Geofence, GeofenceType } from './geofence.entity';

@Injectable()
export class GeofenceService {
  constructor(
    @InjectRepository(Geofence)
    private geofenceRepository: Repository<Geofence>,
  ) {}

  async findAll(filters?: any) {
    const qb = this.geofenceRepository.createQueryBuilder('g');
    if (filters?.isActive !== undefined) qb.andWhere('g.isActive = :a', { a: filters.isActive === 'true' });
    return qb.orderBy('g.name', 'ASC').getMany();
  }

  async findOne(id: number) {
    const g = await this.geofenceRepository.findOne({ where: { id } });
    if (!g) throw new NotFoundException('Geofence not found');
    return g;
  }

  async create(data: Partial<Geofence>, userId: number) {
    const g = this.geofenceRepository.create({ ...data, createdBy: userId });
    return this.geofenceRepository.save(g);
  }

  async update(id: number, data: Partial<Geofence>) {
    await this.findOne(id);
    await this.geofenceRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.geofenceRepository.delete(id);
    return { message: 'Geofence deleted' };
  }

  isInsideCircle(lat: number, lng: number, centerLat: number, centerLng: number, radiusM: number): boolean {
    const R = 6371000;
    const dLat = (lat - centerLat) * Math.PI / 180;
    const dLng = (lng - centerLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(centerLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return dist <= radiusM;
  }

  isInsidePolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  async checkGeofences(deviceId: number, lat: number, lng: number) {
    const geofences = await this.geofenceRepository.find({ where: { isActive: true } });
    const violations: Array<{ geofence: Geofence; inside: boolean }> = [];

    for (const g of geofences) {
      if (g.assignedDevices && !g.assignedDevices.includes(deviceId)) continue;
      let inside = false;
      if (g.type === GeofenceType.CIRCLE) {
        const [cLat, cLng] = g.coordinates;
        inside = this.isInsideCircle(lat, lng, cLat, cLng, g.radius);
      } else if (g.type === GeofenceType.POLYGON || g.type === GeofenceType.RECTANGLE) {
        inside = this.isInsidePolygon(lat, lng, g.coordinates);
      }
      violations.push({ geofence: g, inside });
    }
    return violations;
  }
}
