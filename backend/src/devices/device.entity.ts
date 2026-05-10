import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MOVING = 'moving',
  IDLE = 'idle',
  STOPPED = 'stopped',
  ALARM = 'alarm',
}

export enum VehicleType {
  CAR = 'car',
  TRUCK = 'truck',
  BUS = 'bus',
  MOTORCYCLE = 'motorcycle',
  VAN = 'van',
  OTHER = 'other',
}

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  imei: string;

  @Column({ unique: true, nullable: true })
  simNumber: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  plateNumber: string;

  @Column({ type: 'enum', enum: VehicleType, default: VehicleType.CAR })
  vehicleType: VehicleType;

  @Column({ type: 'enum', enum: DeviceStatus, default: DeviceStatus.OFFLINE })
  status: DeviceStatus;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  speed: number;

  @Column({ nullable: true })
  heading: number;

  @Column({ nullable: true })
  altitude: number;

  @Column({ nullable: true })
  lastUpdate: Date;

  @Column({ nullable: true })
  lastOnline: Date;

  @Column({ nullable: true })
  driverName: string;

  @Column({ nullable: true })
  driverId: number;

  @Column({ nullable: true })
  groupId: number;

  @Column({ nullable: true })
  groupName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  alarmFlags: any;

  @Column({ nullable: true })
  odometer: number;

  @Column({ nullable: true })
  fuelLevel: number;

  @Column({ nullable: true })
  engineOn: boolean;

  @Column({ nullable: true })
  iconColor: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  protocolVersion: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
