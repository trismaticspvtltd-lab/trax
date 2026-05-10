import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';

@Entity('locations')
@Index(['deviceId', 'timestamp'])
export class Location {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  deviceId: number;

  @Column()
  imei: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  speed: number;

  @Column({ default: 0 })
  heading: number;

  @Column({ nullable: true })
  altitude: number;

  @Column({ nullable: true })
  satellites: number;

  @Column({ nullable: true })
  accuracy: number;

  @Column({ default: false })
  engineOn: boolean;

  @Column({ default: true })
  gpsValid: boolean;

  @Column({ type: 'json', nullable: true })
  alarmFlags: any;

  @Column({ type: 'json', nullable: true })
  statusFlags: any;

  @Column({ nullable: true })
  mileage: number;

  @Column({ nullable: true })
  fuelLevel: number;

  @Column({ nullable: true })
  tripId: number;

  @Column({ type: 'timestamp' })
  @Index()
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}
