import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum RecordingType {
  ALARM   = 'alarm',     // Auto-triggered by alarm event
  MANUAL  = 'manual',    // Operator-initiated
  LIVE    = 'live',      // Saved live stream segment
}

export enum RecordingStatus {
  PENDING    = 'pending',     // Waiting for device to start streaming
  RECORDING  = 'recording',   // Actively receiving stream
  PROCESSING = 'processing',  // Transcoding / uploading to S3
  COMPLETE   = 'complete',    // Available for playback
  FAILED     = 'failed',
}

@Entity('video_recordings')
export class VideoRecording {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  imei: string;

  @Column()
  @Index()
  deviceId: number;

  @Column({ nullable: true })
  deviceName: string;

  @Column({ default: 1 })
  channel: number;

  @Column({ type: 'enum', enum: RecordingType, default: RecordingType.MANUAL })
  type: RecordingType;

  @Column({ type: 'enum', enum: RecordingStatus, default: RecordingStatus.PENDING })
  status: RecordingStatus;

  @Column({ nullable: true })
  alarmType: string;          // e.g. 'adasFCW', 'dmsFatigue', 'sos'

  @Column({ nullable: true })
  alarmMessage: string;

  @Column({ nullable: true })
  s3VideoKey: string;         // S3 key for MP4 recording

  @Column({ type: 'json', nullable: true })
  s3ImageKeys: string[];      // S3 keys for captured JPEG images (up to 3)

  @Column({ nullable: true })
  videoUrl: string;           // Presigned URL (refreshed on read)

  @Column({ type: 'json', nullable: true })
  imageUrls: string[];        // Presigned URLs for images

  @Column({ nullable: true })
  durationSeconds: number;

  @Column({ nullable: true })
  fileSizeBytes: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  speed: number;

  @Column({ nullable: true })
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}
