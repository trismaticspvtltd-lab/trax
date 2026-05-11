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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpServerController = void 0;
const common_1 = require("@nestjs/common");
const tcp_server_service_1 = require("./tcp-server.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const jt808_parser_1 = require("./jt808.parser");
let TcpServerController = class TcpServerController {
    tcpServerService;
    constructor(tcpServerService) {
        this.tcpServerService = tcpServerService;
    }
    getConnectedDevices() {
        return this.tcpServerService.getConnectedDevices();
    }
    vehicleControl(imei, body) {
        if (body.flags === undefined)
            throw new common_1.BadRequestException('flags required');
        const sent = this.tcpServerService.sendVehicleControl(imei, body.flags);
        if (!sent)
            throw new common_1.NotFoundException(`Device ${imei} not connected`);
        return { sent: true, flags: body.flags, flagNames: resolveControlFlags(body.flags) };
    }
    queryLocation(imei) {
        const sent = this.tcpServerService.sendQueryLocation(imei);
        if (!sent)
            throw new common_1.NotFoundException(`Device ${imei} not connected`);
        return { sent: true, note: 'Location will arrive as 0x0201 and be emitted via WebSocket' };
    }
    tempTracking(imei, body) {
        const sent = this.tcpServerService.sendTempTracking(imei, body.interval ?? 10, body.validity ?? 300);
        if (!sent)
            throw new common_1.NotFoundException(`Device ${imei} not connected`);
        return { sent: true };
    }
    setParams(imei, body) {
        if (!body.params?.length)
            throw new common_1.BadRequestException('params[] required');
        const params = body.params.map((p) => ({
            id: p.id,
            value: encodeParamValue(p.type, p.value),
        }));
        const sent = this.tcpServerService.sendSetParams(imei, params);
        if (!sent)
            throw new common_1.NotFoundException(`Device ${imei} not connected`);
        return { sent: true };
    }
    queryParams(imei, body) {
        const sent = this.tcpServerService.sendQueryParams(imei, body.paramIds);
        if (!sent)
            throw new common_1.NotFoundException(`Device ${imei} not connected`);
        return { sent: true, note: 'Params will arrive as 0x0104 and be emitted via WebSocket device_event' };
    }
    sendText(imei, body) {
        if (!body.text)
            throw new common_1.BadRequestException('text required');
        const sent = this.tcpServerService.sendTextMessage(imei, body.flags ?? 1, body.text);
        if (!sent)
            throw new common_1.NotFoundException(`Device ${imei} not connected`);
        return { sent: true };
    }
    terminalControl(imei, body) {
        if (body.cmd === undefined)
            throw new common_1.BadRequestException('cmd required');
        const sent = this.tcpServerService.sendTerminalControl(imei, body.cmd, body.param);
        if (!sent)
            throw new common_1.NotFoundException(`Device ${imei} not connected`);
        return { sent: true };
    }
    takePhoto(imei, body) {
        const sent = this.tcpServerService.sendCameraShoot(imei, body.channel ?? 1, body.command ?? 0, body.interval ?? 0, body.savingFlag ?? 0, body.resolution ?? 0xff, body.quality ?? 8);
        if (!sent)
            throw new common_1.NotFoundException(`Device ${imei} not connected`);
        return { sent: true };
    }
    requestVideo(imei, body) {
        if (!body.serverIp || !body.serverTcpPort)
            throw new common_1.BadRequestException('serverIp and serverTcpPort required');
        const sent = this.tcpServerService.sendRealtimeVideoRequest(imei, body.serverIp, body.serverTcpPort, body.serverUdpPort ?? body.serverTcpPort, body.channel ?? 1, body.dataType ?? 0, body.streamType ?? 0);
        if (!sent)
            throw new common_1.NotFoundException(`Device ${imei} not connected`);
        return { sent: true };
    }
    videoControl(imei, body) {
        const sent = this.tcpServerService.sendVideoControl(imei, body.channel ?? 1, body.command, body.closeType);
        if (!sent)
            throw new common_1.NotFoundException(`Device ${imei} not connected`);
        return { sent: true };
    }
    histVideoRequest(imei, body) {
        if (!body.startTime || !body.endTime || !body.serverIp || !body.serverTcpPort)
            throw new common_1.BadRequestException('startTime, endTime, serverIp, serverTcpPort required');
        const sent = this.tcpServerService.sendHistVideoRequest(imei, body.channel ?? 1, body.mediaType ?? 0, body.streamType ?? 0, body.storageType ?? 0, body.playbackMode ?? 0, body.playbackSpeed ?? 0, new Date(body.startTime), new Date(body.endTime), body.serverIp, body.serverTcpPort, body.serverUdpPort ?? body.serverTcpPort);
        if (!sent)
            throw new common_1.NotFoundException(`Device ${imei} not connected`);
        return { sent: true };
    }
    queryFiles(imei, body) {
        if (!body.startTime || !body.endTime)
            throw new common_1.BadRequestException('startTime and endTime required');
        const sent = this.tcpServerService.sendFileListQuery(imei, body.channel ?? 0, new Date(body.startTime), new Date(body.endTime), body.alarmFlag ?? 0, body.mediaType ?? 0, body.storageType ?? 0);
        if (!sent)
            throw new common_1.NotFoundException(`Device ${imei} not connected`);
        return { sent: true, note: 'File list will arrive via WebSocket device_event' };
    }
    fileUploadControl(imei, body) {
        if (!body.serverIp || !body.serverTcpPort || !body.startTime || !body.endTime)
            throw new common_1.BadRequestException('serverIp, serverTcpPort, startTime, endTime required');
        const sent = this.tcpServerService.sendFileUploadControl(imei, body.serverIp, body.serverTcpPort, body.channel ?? 1, new Date(body.startTime), new Date(body.endTime), body.alarmFlag ?? 0, body.mediaType ?? 0, body.storageType ?? 0, body.taskId ?? 1, body.condition ?? 0);
        if (!sent)
            throw new common_1.NotFoundException(`Device ${imei} not connected`);
        return { sent: true };
    }
    ptzControl(imei, body) {
        if (body.cmd === undefined)
            throw new common_1.BadRequestException('cmd required');
        const sent = this.tcpServerService.sendPtzControl(imei, body.channel ?? 1, body.speed ?? 0, body.cmd);
        if (!sent)
            throw new common_1.NotFoundException(`Device ${imei} not connected`);
        return { sent: true };
    }
};
exports.TcpServerController = TcpServerController;
__decorate([
    (0, common_1.Get)('connected'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TcpServerController.prototype, "getConnectedDevices", null);
__decorate([
    (0, common_1.Post)(':imei/control/vehicle'),
    __param(0, (0, common_1.Param)('imei')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TcpServerController.prototype, "vehicleControl", null);
__decorate([
    (0, common_1.Post)(':imei/control/query-location'),
    __param(0, (0, common_1.Param)('imei')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TcpServerController.prototype, "queryLocation", null);
__decorate([
    (0, common_1.Post)(':imei/control/temp-tracking'),
    __param(0, (0, common_1.Param)('imei')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TcpServerController.prototype, "tempTracking", null);
__decorate([
    (0, common_1.Post)(':imei/control/set-params'),
    __param(0, (0, common_1.Param)('imei')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TcpServerController.prototype, "setParams", null);
__decorate([
    (0, common_1.Post)(':imei/control/query-params'),
    __param(0, (0, common_1.Param)('imei')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TcpServerController.prototype, "queryParams", null);
__decorate([
    (0, common_1.Post)(':imei/control/text'),
    __param(0, (0, common_1.Param)('imei')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TcpServerController.prototype, "sendText", null);
__decorate([
    (0, common_1.Post)(':imei/control/terminal'),
    __param(0, (0, common_1.Param)('imei')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TcpServerController.prototype, "terminalControl", null);
__decorate([
    (0, common_1.Post)(':imei/control/photo'),
    __param(0, (0, common_1.Param)('imei')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TcpServerController.prototype, "takePhoto", null);
__decorate([
    (0, common_1.Post)(':imei/control/video'),
    __param(0, (0, common_1.Param)('imei')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TcpServerController.prototype, "requestVideo", null);
__decorate([
    (0, common_1.Post)(':imei/control/video-ctrl'),
    __param(0, (0, common_1.Param)('imei')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TcpServerController.prototype, "videoControl", null);
__decorate([
    (0, common_1.Post)(':imei/control/video-playback'),
    __param(0, (0, common_1.Param)('imei')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TcpServerController.prototype, "histVideoRequest", null);
__decorate([
    (0, common_1.Post)(':imei/control/query-files'),
    __param(0, (0, common_1.Param)('imei')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TcpServerController.prototype, "queryFiles", null);
__decorate([
    (0, common_1.Post)(':imei/control/upload-files'),
    __param(0, (0, common_1.Param)('imei')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TcpServerController.prototype, "fileUploadControl", null);
__decorate([
    (0, common_1.Post)(':imei/control/ptz'),
    __param(0, (0, common_1.Param)('imei')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TcpServerController.prototype, "ptzControl", null);
exports.TcpServerController = TcpServerController = __decorate([
    (0, common_1.Controller)('devices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [tcp_server_service_1.TcpServerService])
], TcpServerController);
function resolveControlFlags(flags) {
    const names = [];
    if (flags & jt808_parser_1.VehicleControlCmd.CUT_OIL)
        names.push('CUT_OIL');
    if (flags & jt808_parser_1.VehicleControlCmd.RESTORE_OIL)
        names.push('RESTORE_OIL');
    if (flags & jt808_parser_1.VehicleControlCmd.CUT_CIRCUIT)
        names.push('CUT_CIRCUIT');
    if (flags & jt808_parser_1.VehicleControlCmd.RESTORE_CIRCUIT)
        names.push('RESTORE_CIRCUIT');
    if (flags & jt808_parser_1.VehicleControlCmd.DOOR_LOCK)
        names.push('DOOR_LOCK');
    if (flags & jt808_parser_1.VehicleControlCmd.DOOR_UNLOCK)
        names.push('DOOR_UNLOCK');
    return names;
}
function encodeParamValue(type, value) {
    switch (type) {
        case 'dword': {
            const b = Buffer.alloc(4);
            b.writeUInt32BE(Number(value), 0);
            return b;
        }
        case 'word': {
            const b = Buffer.alloc(2);
            b.writeUInt16BE(Number(value), 0);
            return b;
        }
        case 'byte': {
            const b = Buffer.alloc(1);
            b[0] = Number(value) & 0xff;
            return b;
        }
        default: return Buffer.from(String(value), 'utf8');
    }
}
//# sourceMappingURL=tcp-server.controller.js.map