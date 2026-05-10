import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.alertsService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.alertsService.getStats();
  }

  @Get('unread-count')
  getUnreadCount() {
    return this.alertsService.getUnreadCount();
  }

  @Put('mark-all-read')
  markAllAsRead(@Query('deviceId') deviceId: string) {
    return this.alertsService.markAllAsRead(deviceId ? +deviceId : undefined);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.alertsService.markAsRead(+id);
  }

  @Put(':id/resolve')
  resolve(@Param('id') id: string, @Request() req) {
    return this.alertsService.resolve(+id, req.user.id);
  }
}
