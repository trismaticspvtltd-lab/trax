"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpServerModule = void 0;
const common_1 = require("@nestjs/common");
const tcp_server_service_1 = require("./tcp-server.service");
const tcp_server_controller_1 = require("./tcp-server.controller");
const devices_module_1 = require("../devices/devices.module");
const tracking_module_1 = require("../tracking/tracking.module");
const video_recordings_module_1 = require("../video-recordings/video-recordings.module");
let TcpServerModule = class TcpServerModule {
};
exports.TcpServerModule = TcpServerModule;
exports.TcpServerModule = TcpServerModule = __decorate([
    (0, common_1.Module)({
        imports: [devices_module_1.DevicesModule, tracking_module_1.TrackingModule, video_recordings_module_1.VideoRecordingsModule],
        providers: [tcp_server_service_1.TcpServerService],
        controllers: [tcp_server_controller_1.TcpServerController],
        exports: [tcp_server_service_1.TcpServerService],
    })
], TcpServerModule);
//# sourceMappingURL=tcp-server.module.js.map