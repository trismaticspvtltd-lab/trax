import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoRecording } from './video-recording.entity';
import { VideoRecordingsService } from './video-recordings.service';
import { VideoRecordingsController } from './video-recordings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VideoRecording])],
  providers: [VideoRecordingsService],
  controllers: [VideoRecordingsController],
  exports: [VideoRecordingsService],
})
export class VideoRecordingsModule {}
