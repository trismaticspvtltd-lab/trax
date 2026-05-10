import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { GeofenceService } from './geofence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('geofences')
@UseGuards(JwtAuthGuard)
export class GeofenceController {
  constructor(private geofenceService: GeofenceService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.geofenceService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.geofenceService.findOne(+id);
  }

  @Post()
  create(@Body() body: any, @Request() req) {
    return this.geofenceService.create(body, req.user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.geofenceService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.geofenceService.remove(+id);
  }
}
