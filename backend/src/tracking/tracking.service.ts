import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Location } from './location.entity';
import { TrackingGateway } from './tracking.gateway';
import { DevicesService } from '../devices/devices.service';
import { AlertsService } from '../alerts/alerts.service';
import { DeviceStatus } from '../devices/device.entity';
import { AlertType, AlertSeverity } from '../alerts/alert.entity';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    private trackingGateway: TrackingGateway,
    private devicesService: DevicesService,
    private alertsService: AlertsService,
  ) {}

  async processLocationUpdate(imei: string, locationData: any) {
    const device = await this.devicesService.findByImei(imei);
    if (!device) return null;

    const location = this.locationRepository.create({
      deviceId: device.id,
      imei,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      speed: locationData.speed || 0,
      heading: locationData.heading || 0,
      altitude: locationData.altitude || 0,
      satellites: locationData.satellites,
      accuracy: locationData.accuracy,
      engineOn: locationData.engineOn || false,
      gpsValid: locationData.gpsValid !== false,
      alarmFlags: locationData.alarmFlags,
      statusFlags: locationData.statusFlags,
      mileage: locationData.mileage,
      fuelLevel: locationData.fuelLevel,
      timestamp: locationData.timestamp || new Date(),
    });
    await this.locationRepository.save(location);

    const status = locationData.speed > 5
      ? DeviceStatus.MOVING
      : locationData.engineOn ? DeviceStatus.IDLE : DeviceStatus.STOPPED;

    const updatedDevice = await this.devicesService.updateLocation(imei, {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      speed: locationData.speed,
      heading: locationData.heading,
      altitude: locationData.altitude,
      engineOn: locationData.engineOn,
      status,
      odometer: locationData.mileage,
      fuelLevel: locationData.fuelLevel,
    });

    const payload = {
      deviceId: device.id,
      imei,
      name: device.name,
      plateNumber: device.plateNumber,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      speed: locationData.speed,
      heading: locationData.heading,
      status,
      engineOn: locationData.engineOn,
      timestamp: location.timestamp,
      alarmFlags: locationData.alarmFlags,
    };

    this.trackingGateway.emitLocationUpdate(device.id, payload);

    if (locationData.alarmFlags) {
      await this.processAlarms(device, locationData);
    }

    return location;
  }

  private async processAlarms(device: any, locationData: any) {
    const flags = locationData.alarmFlags;
    const spd = Math.round(locationData.speed || 0);
    const alertMap = [
      { flag: 'sos',              type: AlertType.SOS,                 severity: AlertSeverity.CRITICAL, msg: 'SOS Emergency triggered' },
      { flag: 'overSpeed',        type: AlertType.SPEEDING,            severity: AlertSeverity.HIGH,     msg: `Speeding: ${spd} km/h` },
      { flag: 'powerCut',         type: AlertType.POWER_CUT,           severity: AlertSeverity.CRITICAL, msg: 'External power cut detected' },
      { flag: 'collision',        type: AlertType.COLLISION,           severity: AlertSeverity.CRITICAL, msg: 'Collision detected' },
      { flag: 'rollover',         type: AlertType.ROLLOVER,            severity: AlertSeverity.CRITICAL, msg: 'Vehicle rollover detected' },
      { flag: 'fatigue',          type: AlertType.FATIGUE_DRIVING,     severity: AlertSeverity.HIGH,     msg: 'Fatigue driving (standard)' },
      { flag: 'vehicleTheft',     type: AlertType.VEHICLE_THEFT,       severity: AlertSeverity.CRITICAL, msg: 'Vehicle theft alarm' },
      { flag: 'illegalIgnition',  type: AlertType.UNAUTHORIZED_IGNITION, severity: AlertSeverity.HIGH,  msg: 'Unauthorized ignition detected' },
      { flag: 'gnssFault',        type: AlertType.GNSS_FAULT,          severity: AlertSeverity.MEDIUM,   msg: 'GNSS module fault' },
      // ADAS
      { flag: 'adasFCW',         type: AlertType.FORWARD_COLLISION,   severity: AlertSeverity.CRITICAL, msg: 'ADAS: Forward Collision Warning' },
      { flag: 'adasLDW',         type: AlertType.LANE_DEPARTURE,      severity: AlertSeverity.HIGH,     msg: 'ADAS: Lane Departure Warning' },
      { flag: 'adasPCW',         type: AlertType.ADAS_PCW,            severity: AlertSeverity.CRITICAL, msg: 'ADAS: Pedestrian Collision Warning' },
      { flag: 'adasBSM',         type: AlertType.ADAS_BSM,            severity: AlertSeverity.HIGH,     msg: 'ADAS: Blind Spot Monitoring alert' },
      // DMS
      { flag: 'dmsFatigue',      type: AlertType.DMS_FATIGUE,         severity: AlertSeverity.HIGH,     msg: 'DMS: Driver fatigue detected' },
      { flag: 'dmsDistraction',  type: AlertType.DMS_DISTRACTION,     severity: AlertSeverity.HIGH,     msg: 'DMS: Driver distraction detected' },
      { flag: 'dmsPhone',        type: AlertType.DMS_PHONE,           severity: AlertSeverity.HIGH,     msg: 'DMS: Phone use while driving' },
      { flag: 'dmsSmoking',      type: AlertType.DMS_SMOKING,         severity: AlertSeverity.MEDIUM,   msg: 'DMS: Smoking while driving' },
    ];

    for (const { flag, type, severity, msg } of alertMap) {
      if (flags[flag]) {
        const alert = await this.alertsService.create({
          deviceId: device.id,
          imei: device.imei,
          deviceName: device.name,
          type,
          severity,
          message: msg,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          speed: locationData.speed,
          timestamp: locationData.timestamp || new Date(),
        });
        this.trackingGateway.emitAlert(alert);
      }
    }
  }

  async getHistory(deviceId: number, startDate: Date, endDate: Date) {
    return this.locationRepository.find({
      where: {
        deviceId,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });
  }

  async getLatestLocation(deviceId: number) {
    return this.locationRepository.findOne({
      where: { deviceId },
      order: { timestamp: 'DESC' },
    });
  }

  async getLocationsByTrip(tripId: number) {
    return this.locationRepository.find({
      where: { tripId },
      order: { timestamp: 'ASC' },
    });
  }

  async getDailyMileage(deviceId: number, date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const locations = await this.getHistory(deviceId, start, end);
    if (locations.length < 2) return 0;

    let distance = 0;
    for (let i = 1; i < locations.length; i++) {
      distance += this.calcDistance(
        +locations[i - 1].latitude, +locations[i - 1].longitude,
        +locations[i].latitude, +locations[i].longitude,
      );
    }
    return Math.round(distance * 100) / 100;
  }

  calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
