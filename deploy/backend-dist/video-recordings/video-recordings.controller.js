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
exports.VideoRecordingsController = void 0;
const common_1 = require("@nestjs/common");
const video_recordings_service_1 = require("./video-recordings.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const video_recording_entity_1 = require("./video-recording.entity");
let VideoRecordingsController = class VideoRecordingsController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(imei, deviceId, type, status, from, to, page, limit) {
        return this.service.findAll({
            imei,
            deviceId: deviceId ? parseInt(deviceId) : undefined,
            type,
            status,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }
    findOne(id) {
        return this.service.findOneWithUrls(id);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.VideoRecordingsController = VideoRecordingsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('imei')),
    __param(1, (0, common_1.Query)('deviceId')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('from')),
    __param(5, (0, common_1.Query)('to')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], VideoRecordingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], VideoRecordingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], VideoRecordingsController.prototype, "remove", null);
exports.VideoRecordingsController = VideoRecordingsController = __decorate([
    (0, common_1.Controller)('recordings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [video_recordings_service_1.VideoRecordingsService])
], VideoRecordingsController);
//# sourceMappingURL=video-recordings.controller.js.map