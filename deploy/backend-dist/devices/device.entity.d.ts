export declare enum DeviceStatus {
    ONLINE = "online",
    OFFLINE = "offline",
    MOVING = "moving",
    IDLE = "idle",
    STOPPED = "stopped",
    ALARM = "alarm"
}
export declare enum VehicleType {
    CAR = "car",
    TRUCK = "truck",
    BUS = "bus",
    MOTORCYCLE = "motorcycle",
    VAN = "van",
    OTHER = "other"
}
export declare class Device {
    id: number;
    imei: string;
    simNumber: string;
    name: string;
    plateNumber: string;
    vehicleType: VehicleType;
    status: DeviceStatus;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    altitude: number;
    lastUpdate: Date;
    lastOnline: Date;
    driverName: string;
    driverId: number;
    groupId: number;
    groupName: string;
    isActive: boolean;
    alarmFlags: any;
    odometer: number;
    fuelLevel: number;
    engineOn: boolean;
    iconColor: string;
    model: string;
    protocolVersion: string;
    createdAt: Date;
    updatedAt: Date;
}
