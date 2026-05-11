import { OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class MediaServerGateway implements OnGatewayInit {
    server: Server;
    private readonly logger;
    afterInit(): void;
    handleSubscribe(client: Socket, data: {
        imei: string;
        channel?: number;
    }): {
        event: string;
        room: string;
    };
    handleUnsubscribe(client: Socket, data: {
        imei: string;
        channel?: number;
    }): {
        event: string;
        room: string;
    };
    emitFrame(imei: string, channel: number, frameData: Buffer, isKeyFrame: boolean): void;
    emitStreamEvent(imei: string, channel: number, event: string, data?: any): void;
}
