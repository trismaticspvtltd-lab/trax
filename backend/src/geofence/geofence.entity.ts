import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum GeofenceType {
  CIRCLE = 'circle',
  POLYGON = 'polygon',
  RECTANGLE = 'rectangle',
}

@Entity('geofences')
export class Geofence {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: GeofenceType, default: GeofenceType.CIRCLE })
  type: GeofenceType;

  @Column({ type: 'json' })
  coordinates: any;

  @Column({ nullable: true })
  radius: number;

  @Column({ default: '#FF5733' })
  color: string;

  @Column({ default: true })
  alertOnEnter: boolean;

  @Column({ default: true })
  alertOnExit: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  assignedDevices: number[];

  @Column({ nullable: true })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
