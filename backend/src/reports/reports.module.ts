import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Location } from '../tracking/location.entity';
import { Alert } from '../alerts/alert.entity';
import { Trip } from '../trips/trip.entity';
import { Device } from '../devices/device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Alert, Trip, Device])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
