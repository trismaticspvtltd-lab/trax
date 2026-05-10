import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Location } from '../tracking/location.entity';
import { Alert } from '../alerts/alert.entity';
import { Trip } from '../trips/trip.entity';
import { Device } from '../devices/device.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
  ) {}

  async getMileageReport(deviceId: number, startDate: Date, endDate: Date) {
    const locations = await this.locationRepository.find({
      where: { deviceId, timestamp: Between(startDate, endDate) },
      order: { timestamp: 'ASC' },
    });

    const dailyMap = new Map<string, { distance: number; locations: any[] }>();
    for (let i = 1; i < locations.length; i++) {
      const date = locations[i].timestamp.toISOString().split('T')[0];
      if (!dailyMap.has(date)) dailyMap.set(date, { distance: 0, locations: [] });
      const entry = dailyMap.get(date)!;
      entry.distance += this.calcDistance(
        +locations[i - 1].latitude, +locations[i - 1].longitude,
        +locations[i].latitude, +locations[i].longitude,
      );
      entry.locations.push(locations[i]);
    }

    const result: Array<{ date: string; distance: number; points: number }> = [];
    for (const [date, data] of dailyMap) {
      result.push({ date, distance: Math.round(data.distance * 100) / 100, points: data.locations.length });
    }
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getSpeedReport(deviceId: number, startDate: Date, endDate: Date) {
    const locations = await this.locationRepository.find({
      where: { deviceId, timestamp: Between(startDate, endDate) },
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

  async getAlertReport(deviceId: number, startDate: Date, endDate: Date) {
    const alerts = await this.alertRepository.find({
      where: { deviceId, timestamp: Between(startDate, endDate) },
      order: { timestamp: 'DESC' },
    });

    const byType = alerts.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total: alerts.length, byType, alerts };
  }

  async getTripReport(deviceId: number, startDate: Date, endDate: Date) {
    const trips = await this.tripRepository.find({
      where: { deviceId, startTime: Between(startDate, endDate) as any },
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

  async getFleetSummary(startDate: Date, endDate: Date) {
    const devices = await this.deviceRepository.find({ where: { isActive: true } });
    const summary: Array<any> = [];

    for (const device of devices) {
      const trips = await this.tripRepository.find({
        where: { deviceId: device.id, startTime: Between(startDate, endDate) as any },
      });
      const alerts = await this.alertRepository.count({
        where: { deviceId: device.id, timestamp: Between(startDate, endDate) },
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

  private calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
