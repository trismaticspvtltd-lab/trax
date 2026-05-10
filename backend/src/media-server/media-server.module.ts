import { Module } from '@nestjs/common';
import { MediaServerService } from './media-server.service';
import { MediaServerGateway } from './media-server.gateway';
import { MediaServerController } from './media-server.controller';
import { VideoRecordingsModule } from '../video-recordings/video-recordings.module';

@Module({
  imports: [VideoRecordingsModule],
  controllers: [MediaServerController],
  providers: [MediaServerService, MediaServerGateway],
  exports: [MediaServerService, MediaServerGateway],
})
export class MediaServerModule {}
