import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('mileage')
  getMileage(@Query('deviceId') deviceId: string, @Query('start') start: string, @Query('end') end: string) {
    return this.reportsService.getMileageReport(+deviceId, new Date(start), new Date(end));
  }

  @Get('speed')
  getSpeed(@Query('deviceId') deviceId: string, @Query('start') start: string, @Query('end') end: string) {
    return this.reportsService.getSpeedReport(+deviceId, new Date(start), new Date(end));
  }

  @Get('alerts')
  getAlerts(@Query('deviceId') deviceId: string, @Query('start') start: string, @Query('end') end: string) {
    return this.reportsService.getAlertReport(+deviceId, new Date(start), new Date(end));
  }

  @Get('trips')
  getTrips(@Query('deviceId') deviceId: string, @Query('start') start: string, @Query('end') end: string) {
    return this.reportsService.getTripReport(+deviceId, new Date(start), new Date(end));
  }

  @Get('fleet')
  getFleet(@Query('start') start: string, @Query('end') end: string) {
    return this.reportsService.getFleetSummary(new Date(start), new Date(end));
  }
}
