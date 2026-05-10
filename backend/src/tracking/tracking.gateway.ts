import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/tracking',
})
export class TrackingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('TrackingGateway');
  private connectedClients = new Map<string, Socket>();

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);
    this.logger.log(`Client connected: ${client.id} (total: ${this.connectedClients.size})`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_device')
  handleSubscribeDevice(client: Socket, deviceId: string) {
    client.join(`device_${deviceId}`);
    return { event: 'subscribed', data: deviceId };
  }

  @SubscribeMessage('unsubscribe_device')
  handleUnsubscribeDevice(client: Socket, deviceId: string) {
    client.leave(`device_${deviceId}`);
    return { event: 'unsubscribed', data: deviceId };
  }

  @SubscribeMessage('subscribe_all')
  handleSubscribeAll(client: Socket) {
    client.join('all_devices');
    return { event: 'subscribed_all' };
  }

  emitLocationUpdate(deviceId: number, data: any) {
    this.server.to(`device_${deviceId}`).emit('location_update', data);
    this.server.to('all_devices').emit('location_update', data);
  }

  emitAlert(data: any) {
    this.server.emit('new_alert', data);
  }

  emitDeviceStatusChange(deviceId: number, status: string) {
    this.server.emit('device_status', { deviceId, status });
  }

  emitDeviceEvent(imei: string, event: string, data: any) {
    this.server.emit('device_event', { imei, event, data, ts: new Date() });
  }

  getConnectedCount() {
    return this.connectedClients.size;
  }
}
