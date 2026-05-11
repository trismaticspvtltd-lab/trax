"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaServerModule = void 0;
const common_1 = require("@nestjs/common");
const media_server_service_1 = require("./media-server.service");
const media_server_gateway_1 = require("./media-server.gateway");
const media_server_controller_1 = require("./media-server.controller");
const video_recordings_module_1 = require("../video-recordings/video-recordings.module");
let MediaServerModule = class MediaServerModule {
};
exports.MediaServerModule = MediaServerModule;
exports.MediaServerModule = MediaServerModule = __decorate([
    (0, common_1.Module)({
        imports: [video_recordings_module_1.VideoRecordingsModule],
        controllers: [media_server_controller_1.MediaServerController],
        providers: [media_server_service_1.MediaServerService, media_server_gateway_1.MediaServerGateway],
        exports: [media_server_service_1.MediaServerService, media_server_gateway_1.MediaServerGateway],
    })
], MediaServerModule);
//# sourceMappingURL=media-server.module.js.map