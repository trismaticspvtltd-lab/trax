"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaServerGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
let MediaServerGateway = class MediaServerGateway {
    server;
    logger = new common_1.Logger('MediaGateway');
    afterInit() {
        this.logger.log('Media WebSocket Gateway initialized');
    }
    handleSubscribe(client, data) {
        const room = `stream_${data.imei}_${data.channel ?? 1}`;
        client.join(room);
        return { event: 'subscribed', room };
    }
    handleUnsubscribe(client, data) {
        const room = `stream_${data.imei}_${data.channel ?? 1}`;
        client.leave(room);
        return { event: 'unsubscribed', room };
    }
    emitFrame(imei, channel, frameData, isKeyFrame) {
        const room = `stream_${imei}_${channel}`;
        this.server.to(room).emit('frame', {
            imei,
            channel,
            video: frameData,
            keyFrame: isKeyFrame,
            ts: Date.now(),
        });
    }
    emitStreamEvent(imei, channel, event, data) {
        const room = `stream_${imei}_${channel}`;
        this.server.to(room).emit('stream_event', { imei, channel, event, data, ts: Date.now() });
        this.server.emit('stream_status', { imei, channel, status: event, ts: Date.now() });
    }
};
exports.MediaServerGateway = MediaServerGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MediaServerGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe_stream'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MediaServerGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe_stream'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MediaServerGateway.prototype, "handleUnsubscribe", null);
exports.MediaServerGateway = MediaServerGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*', methods: ['GET', 'POST'] },
        namespace: '/media',
    })
], MediaServerGateway);
//# sourceMappingURL=media-server.gateway.js.map