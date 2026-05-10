import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Trip, TripStatus } from './trip.entity';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
  ) {}

  async findAll(filters?: any) {
    const where: FindOptionsWhere<Trip> = {};
    if (filters?.deviceId) where.deviceId = +filters.deviceId;
    if (filters?.status) where.status = filters.status;

    const take = filters?.limit ? +filters.limit : 50;
    const skip = filters?.offset ? +filters.offset : 0;

    if (filters?.startDate && filters?.endDate) {
      where.startTime = Between(new Date(filters.startDate), new Date(filters.endDate)) as any;
    }

    const [trips, total] = await this.tripRepository.findAndCount({
      where,
      order: { startTime: 'DESC' },
      take,
      skip,
    });
    return { trips, total };
  }

  async findOne(id: number) {
    return this.tripRepository.findOne({ where: { id } });
  }

  async startTrip(deviceId: number, imei: string, lat: number, lng: number, driverId?: number, driverName?: string) {
    const existing = await this.tripRepository.findOne({
      where: { deviceId, status: TripStatus.ACTIVE },
    });
    if (existing) return existing;

    const trip = this.tripRepository.create({
      deviceId,
      imei,
      driverId,
      driverName,
      status: TripStatus.ACTIVE,
      startTime: new Date(),
      startLat: lat,
      startLng: lng,
    });
    return this.tripRepository.save(trip);
  }

  async endTrip(deviceId: number, lat: number, lng: number, distance: number, maxSpeed: number, avgSpeed: number) {
    const trip = await this.tripRepository.findOne({
      where: { deviceId, status: TripStatus.ACTIVE },
      order: { startTime: 'DESC' },
    });
    if (!trip) return null;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - trip.startTime.getTime()) / 1000);

    await this.tripRepository.update(trip.id, {
      status: TripStatus.COMPLETED,
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

  async getStats(deviceId?: number) {
    const qb = this.tripRepository.createQueryBuilder('t');
    if (deviceId) qb.where('t.deviceId = :deviceId', { deviceId });

    const total = await qb.getCount();
    const totalDistance = await qb.select('SUM(t.distance)', 'total').getRawOne();
    const avgSpeed = await qb.select('AVG(t.avgSpeed)', 'avg').getRawOne();
    return {
      total,
      totalDistance: totalDistance?.total || 0,
      avgSpeed: avgSpeed?.avg || 0,
    };
  }

  async getByDateRange(startDate: Date, endDate: Date, deviceId?: number) {
    const where: any = { startTime: Between(startDate, endDate) };
    if (deviceId) where.deviceId = deviceId;
    return this.tripRepository.find({ where, order: { startTime: 'DESC' } });
  }
}
