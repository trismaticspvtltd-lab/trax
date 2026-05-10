import { Module } from '@nestjs/common';
import { TcpServerService } from './tcp-server.service';
import { TcpServerController } from './tcp-server.controller';
import { DevicesModule } from '../devices/devices.module';
import { TrackingModule } from '../tracking/tracking.module';
import { VideoRecordingsModule } from '../video-recordings/video-recordings.module';

@Module({
  imports: [DevicesModule, TrackingModule, VideoRecordingsModule],
  providers: [TcpServerService],
  controllers: [TcpServerController],
  exports: [TcpServerService],
})
export class TcpServerModule {}
