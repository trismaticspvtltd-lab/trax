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
exports.TrackingGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let TrackingGateway = class TrackingGateway {
    server;
    logger = new common_1.Logger('TrackingGateway');
    connectedClients = new Map();
    afterInit() {
        this.logger.log('WebSocket Gateway initialized');
    }
    handleConnection(client) {
        this.connectedClients.set(client.id, client);
        this.logger.log(`Client connected: ${client.id} (total: ${this.connectedClients.size})`);
    }
    handleDisconnect(client) {
        this.connectedClients.delete(client.id);
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleSubscribeDevice(client, deviceId) {
        client.join(`device_${deviceId}`);
        return { event: 'subscribed', data: deviceId };
    }
    handleUnsubscribeDevice(client, deviceId) {
        client.leave(`device_${deviceId}`);
        return { event: 'unsubscribed', data: deviceId };
    }
    handleSubscribeAll(client) {
        client.join('all_devices');
        return { event: 'subscribed_all' };
    }
    emitLocationUpdate(deviceId, data) {
        this.server.to(`device_${deviceId}`).emit('location_update', data);
        this.server.to('all_devices').emit('location_update', data);
    }
    emitAlert(data) {
        this.server.emit('new_alert', data);
    }
    emitDeviceStatusChange(deviceId, status) {
        this.server.emit('device_status', { deviceId, status });
    }
    emitDeviceEvent(imei, event, data) {
        this.server.emit('device_event', { imei, event, data, ts: new Date() });
    }
    getConnectedCount() {
        return this.connectedClients.size;
    }
};
exports.TrackingGateway = TrackingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TrackingGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe_device'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], TrackingGateway.prototype, "handleSubscribeDevice", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe_device'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], TrackingGateway.prototype, "handleUnsubscribeDevice", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe_all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], TrackingGateway.prototype, "handleSubscribeAll", null);
exports.TrackingGateway = TrackingGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        namespace: '/tracking',
    })
], TrackingGateway);
//# sourceMappingURL=tracking.gateway.js.map