import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from './driver.entity';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
  ) {}

  async findAll() {
    return this.driverRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const d = await this.driverRepository.findOne({ where: { id } });
    if (!d) throw new NotFoundException('Driver not found');
    return d;
  }

  async create(data: Partial<Driver>) {
    const driver = this.driverRepository.create(data);
    return this.driverRepository.save(driver);
  }

  async update(id: number, data: Partial<Driver>) {
    await this.findOne(id);
    await this.driverRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.driverRepository.update(id, { isActive: false });
    return { message: 'Driver deactivated' };
  }
}
