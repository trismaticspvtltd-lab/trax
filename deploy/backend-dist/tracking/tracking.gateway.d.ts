import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class TrackingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private connectedClients;
    afterInit(): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribeDevice(client: Socket, deviceId: string): {
        event: string;
        data: string;
    };
    handleUnsubscribeDevice(client: Socket, deviceId: string): {
        event: string;
        data: string;
    };
    handleSubscribeAll(client: Socket): {
        event: string;
    };
    emitLocationUpdate(deviceId: number, data: any): void;
    emitAlert(data: any): void;
    emitDeviceStatusChange(deviceId: number, status: string): void;
    emitDeviceEvent(imei: string, event: string, data: any): void;
    getConnectedCount(): number;
}
