import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
  namespace: '/media',
})
export class MediaServerGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('MediaGateway');

  afterInit() {
    this.logger.log('Media WebSocket Gateway initialized');
  }

  @SubscribeMessage('subscribe_stream')
  handleSubscribe(client: Socket, data: { imei: string; channel?: number }) {
    const room = `stream_${data.imei}_${data.channel ?? 1}`;
    client.join(room);
    return { event: 'subscribed', room };
  }

  @SubscribeMessage('unsubscribe_stream')
  handleUnsubscribe(client: Socket, data: { imei: string; channel?: number }) {
    const room = `stream_${data.imei}_${data.channel ?? 1}`;
    client.leave(room);
    return { event: 'unsubscribed', room };
  }

  /** Emit a raw H.264/audio frame to all subscribers of this stream. */
  emitFrame(imei: string, channel: number, frameData: Buffer, isKeyFrame: boolean) {
    const room = `stream_${imei}_${channel}`;
    this.server.to(room).emit('frame', {
      imei,
      channel,
      video: frameData,
      keyFrame: isKeyFrame,
      ts: Date.now(),
    });
  }

  /** Emit stream lifecycle events (started, stopped, error). */
  emitStreamEvent(imei: string, channel: number, event: string, data?: any) {
    const room = `stream_${imei}_${channel}`;
    this.server.to(room).emit('stream_event', { imei, channel, event, data, ts: Date.now() });
    // Also broadcast to anyone monitoring all streams
    this.server.emit('stream_status', { imei, channel, status: event, ts: Date.now() });
  }
}
