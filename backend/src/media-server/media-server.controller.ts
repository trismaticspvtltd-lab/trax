import { Controller, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { MediaServerService } from './media-server.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaServerController {
  constructor(private readonly mediaServerService: MediaServerService) {}

  @Get('streams')
  getActiveStreams() {
    return this.mediaServerService.getActiveStreams();
  }

  @Delete('streams/:imei')
  stopStream(@Param('imei') imei: string) {
    this.mediaServerService.forceStopStream(imei);
    return { success: true };
  }
}
