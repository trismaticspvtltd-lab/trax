import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum AlertType {
  SPEEDING = 'speeding',
  GEOFENCE_ENTER = 'geofence_enter',
  GEOFENCE_EXIT = 'geofence_exit',
  SOS = 'sos',
  POWER_CUT = 'power_cut',
  LOW_BATTERY = 'low_battery',
  HARSH_BRAKING = 'harsh_braking',
  HARSH_ACCELERATION = 'harsh_acceleration',
  HARSH_CORNERING = 'harsh_cornering',
  COLLISION = 'collision',
  ROLLOVER = 'rollover',
  FATIGUE_DRIVING = 'fatigue_driving',
  LANE_DEPARTURE = 'lane_departure',
  FORWARD_COLLISION = 'forward_collision',
  ADAS_PCW = 'adas_pcw',
  ADAS_BSM = 'adas_bsm',
  DMS_FATIGUE = 'dms_fatigue',
  DMS_DISTRACTION = 'dms_distraction',
  DMS_PHONE = 'dms_phone',
  DMS_SMOKING = 'dms_smoking',
  VEHICLE_THEFT = 'vehicle_theft',
  UNAUTHORIZED_IGNITION = 'unauthorized_ignition',
  GNSS_FAULT = 'gnss_fault',
  ENGINE_ON = 'engine_on',
  ENGINE_OFF = 'engine_off',
  DEVICE_OFFLINE = 'device_offline',
  TAMPERING = 'tampering',
  OTHER = 'other',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  deviceId: number;

  @Column()
  imei: string;

  @Column({ nullable: true })
  deviceName: string;

  @Column({ type: 'enum', enum: AlertType })
  type: AlertType;

  @Column({ type: 'enum', enum: AlertSeverity, default: AlertSeverity.MEDIUM })
  severity: AlertSeverity;

  @Column({ nullable: true })
  message: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  speed: number;

  @Column({ nullable: true })
  geofenceId: number;

  @Column({ nullable: true })
  geofenceName: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isResolved: boolean;

  @Column({ nullable: true })
  resolvedBy: number;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ type: 'json', nullable: true })
  extraData: any;

  @Column({ type: 'timestamp' })
  @Index()
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}
