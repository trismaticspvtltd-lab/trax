import 'dotenv/config';
import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { TrackingModule } from './tracking/tracking.module';
import { TcpServerModule } from './tcp-server/tcp-server.module';
import { GeofenceModule } from './geofence/geofence.module';
import { AlertsModule } from './alerts/alerts.module';
import { TripsModule } from './trips/trips.module';
import { ReportsModule } from './reports/reports.module';
import { DriversModule } from './drivers/drivers.module';
import { S3Module } from './s3/s3.module';
import { MediaServerModule } from './media-server/media-server.module';
import { VideoRecordingsModule } from './video-recordings/video-recordings.module';
import { User } from './users/user.entity';
import { Device } from './devices/device.entity';
import { Location } from './tracking/location.entity';
import { Trip } from './trips/trip.entity';
import { Geofence } from './geofence/geofence.entity';
import { Alert } from './alerts/alert.entity';
import { Driver } from './drivers/driver.entity';
import { VideoRecording } from './video-recordings/video-recording.entity';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'traxlogi',
        entities: [User, Device, Location, Trip, Geofence, Alert, Driver, VideoRecording],
        synchronize: true,
        logging: false,
      }),
    }),
    S3Module,
    AuthModule,
    UsersModule,
    DevicesModule,
    TrackingModule,
    TcpServerModule,
    GeofenceModule,
    AlertsModule,
    TripsModule,
    ReportsModule,
    DriversModule,
    MediaServerModule,
    VideoRecordingsModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private authService: AuthService) {}

  async onModuleInit() {
    await this.authService.createInitialAdmin();
  }
}