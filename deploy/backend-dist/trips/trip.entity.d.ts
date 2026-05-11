export declare enum TripStatus {
    ACTIVE = "active",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class Trip {
    id: number;
    deviceId: number;
    imei: string;
    driverId: number;
    driverName: string;
    status: TripStatus;
    startTime: Date;
    endTime: Date;
    startLat: number;
    startLng: number;
    startAddress: string;
    endLat: number;
    endLng: number;
    endAddress: string;
    distance: number;
    maxSpeed: number;
    avgSpeed: number;
    duration: number;
    fuelUsed: number;
    route: any;
    createdAt: Date;
    updatedAt: Date;
}
