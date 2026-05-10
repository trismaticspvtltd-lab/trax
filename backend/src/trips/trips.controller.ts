import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private tripsService: TripsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.tripsService.findAll(query);
  }

  @Get('stats')
  getStats(@Query('deviceId') deviceId: string) {
    return this.tripsService.getStats(deviceId ? +deviceId : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(+id);
  }
}
