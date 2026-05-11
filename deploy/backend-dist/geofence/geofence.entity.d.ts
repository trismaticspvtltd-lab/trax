export declare enum GeofenceType {
    CIRCLE = "circle",
    POLYGON = "polygon",
    RECTANGLE = "rectangle"
}
export declare class Geofence {
    id: number;
    name: string;
    description: string;
    type: GeofenceType;
    coordinates: any;
    radius: number;
    color: string;
    alertOnEnter: boolean;
    alertOnExit: boolean;
    isActive: boolean;
    assignedDevices: number[];
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
}
