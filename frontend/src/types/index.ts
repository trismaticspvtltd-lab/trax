export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface Device {
  id: number;
  imei: string;
  name: string;
  plateNumber?: string;
  vehicleType: string;
  status: 'online' | 'offline' | 'moving' | 'idle' | 'stopped' | 'alarm';
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  lastUpdate?: string;
  lastOnline?: string;
  driverName?: string;
  driverId?: number;
  groupName?: string;
  isActive: boolean;
  engineOn?: boolean;
  odometer?: number;
  fuelLevel?: number;
  iconColor?: string;
  model?: string;
}

export interface Location {
  id: number;
  deviceId: number;
  imei: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  altitude?: number;
  satellites?: number;
  engineOn: boolean;
  gpsValid: boolean;
  alarmFlags?: any;
  timestamp: string;
}

export interface Trip {
  id: number;
  deviceId: number;
  imei: string;
  driverName?: string;
  status: 'active' | 'completed' | 'cancelled';
  startTime: string;
  endTime?: string;
  startLat?: number;
  startLng?: number;
  startAddress?: string;
  endLat?: number;
  endLng?: number;
  endAddress?: string;
  distance: number;
  maxSpeed: number;
  avgSpeed: number;
  duration?: number;
}

export interface Alert {
  id: number;
  deviceId: number;
  imei: string;
  deviceName?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  geofenceName?: string;
  isRead: boolean;
  isResolved: boolean;
  timestamp: string;
}

export interface Geofence {
  id: number;
  name: string;
  description?: string;
  type: 'circle' | 'polygon' | 'rectangle';
  coordinates: any;
  radius?: number;
  color: string;
  alertOnEnter: boolean;
  alertOnExit: boolean;
  isActive: boolean;
  assignedDevices?: number[];
  createdAt?: string;
}

export interface Driver {
  id: number;
  name: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  avatar?: string;
  licenseExpiry?: string;
  assignedDeviceId?: number;
  isActive: boolean;
}

export interface DeviceStats {
  total: number;
  online: number;
  moving: number;
  offline: number;
  idle: number;
}

export interface AlertStats {
  total: number;
  unread: number;
  critical: number;
  today: number;
}

export interface LiveUpdate {
  deviceId: number;
  imei: string;
  name: string;
  plateNumber?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: string;
  engineOn: boolean;
  timestamp: string;
  alarmFlags?: any;
}
