import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum TripStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  deviceId: number;

  @Column()
  imei: string;

  @Column({ nullable: true })
  driverId: number;

  @Column({ nullable: true })
  driverName: string;

  @Column({ type: 'enum', enum: TripStatus, default: TripStatus.ACTIVE })
  status: TripStatus;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  startLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  startLng: number;

  @Column({ nullable: true })
  startAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  endLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  endLng: number;

  @Column({ nullable: true })
  endAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  distance: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  maxSpeed: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  avgSpeed: number;

  @Column({ nullable: true })
  duration: number;

  @Column({ nullable: true })
  fuelUsed: number;

  @Column({ type: 'json', nullable: true })
  route: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
