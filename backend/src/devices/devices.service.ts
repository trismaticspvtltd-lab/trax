import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceStatus } from './device.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
  ) {}

  async findAll(filters?: any) {
    const qb = this.deviceRepository.createQueryBuilder('d');
    if (filters?.status) qb.andWhere('d.status = :status', { status: filters.status });
    if (filters?.groupId) qb.andWhere('d.groupId = :groupId', { groupId: filters.groupId });
    if (filters?.search) {
      qb.andWhere('(d.name LIKE :s OR d.imei LIKE :s OR d.plateNumber LIKE :s)', { s: `%${filters.search}%` });
    }
    return qb.orderBy('d.name', 'ASC').getMany();
  }

  async findOne(id: number) {
    const device = await this.deviceRepository.findOne({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async findByImei(imei: string) {
    return this.deviceRepository.findOne({ where: { imei } });
  }

  async create(data: Partial<Device>) {
    const device = this.deviceRepository.create(data);
    return this.deviceRepository.save(device);
  }

  async update(id: number, data: Partial<Device>) {
    await this.findOne(id);
    await this.deviceRepository.update(id, data);
    return this.findOne(id);
  }

  async updateLocation(imei: string, locationData: Partial<Device>) {
    const device = await this.findByImei(imei);
    if (!device) return null;
    await this.deviceRepository.update(device.id, {
      ...locationData,
      lastUpdate: new Date(),
      lastOnline: new Date(),
    });
    return this.deviceRepository.findOne({ where: { id: device.id } });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.deviceRepository.update(id, { isActive: false });
    return { message: 'Device deactivated' };
  }

  async getStats() {
    const total = await this.deviceRepository.count({ where: { isActive: true } });
    const online = await this.deviceRepository.count({ where: { status: DeviceStatus.ONLINE, isActive: true } });
    const moving = await this.deviceRepository.count({ where: { status: DeviceStatus.MOVING, isActive: true } });
    const offline = await this.deviceRepository.count({ where: { status: DeviceStatus.OFFLINE, isActive: true } });
    const idle = await this.deviceRepository.count({ where: { status: DeviceStatus.IDLE, isActive: true } });
    return { total, online, moving, offline, idle };
  }

  async setOffline(imei: string) {
    const device = await this.findByImei(imei);
    if (device) {
      await this.deviceRepository.update(device.id, { status: DeviceStatus.OFFLINE });
    }
  }

  async updateByImei(imei: string, data: Partial<Device>) {
    const device = await this.findByImei(imei);
    if (!device) return null;
    await this.deviceRepository.update(device.id, data);
    return this.deviceRepository.findOne({ where: { id: device.id } });
  }
}
