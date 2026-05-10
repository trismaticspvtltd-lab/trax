import {
  Controller, Get, Delete, Param, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { VideoRecordingsService } from './video-recordings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecordingType, RecordingStatus } from './video-recording.entity';

@Controller('recordings')
@UseGuards(JwtAuthGuard)
export class VideoRecordingsController {
  constructor(private service: VideoRecordingsService) {}

  @Get()
  findAll(
    @Query('imei')     imei?: string,
    @Query('deviceId') deviceId?: string,
    @Query('type')     type?: RecordingType,
    @Query('status')   status?: RecordingStatus,
    @Query('from')     from?: string,
    @Query('to')       to?: string,
    @Query('page')     page?: string,
    @Query('limit')    limit?: string,
  ) {
    return this.service.findAll({
      imei,
      deviceId: deviceId ? parseInt(deviceId) : undefined,
      type,
      status,
      from: from ? new Date(from) : undefined,
      to:   to   ? new Date(to)   : undefined,
      page:  page  ? parseInt(page)  : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneWithUrls(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
