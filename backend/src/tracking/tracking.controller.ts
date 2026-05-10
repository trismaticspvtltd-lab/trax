import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private trackingService: TrackingService) {}

  @Get(':deviceId/history')
  getHistory(
    @Param('deviceId') deviceId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.trackingService.getHistory(+deviceId, new Date(start), new Date(end));
  }

  @Get(':deviceId/latest')
  getLatest(@Param('deviceId') deviceId: string) {
    return this.trackingService.getLatestLocation(+deviceId);
  }

  @Get(':deviceId/mileage')
  getMileage(@Param('deviceId') deviceId: string, @Query('date') date: string) {
    return this.trackingService.getDailyMileage(+deviceId, date ? new Date(date) : new Date());
  }
}
