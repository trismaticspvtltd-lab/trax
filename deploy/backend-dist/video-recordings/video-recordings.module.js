"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoRecordingsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const video_recording_entity_1 = require("./video-recording.entity");
const video_recordings_service_1 = require("./video-recordings.service");
const video_recordings_controller_1 = require("./video-recordings.controller");
let VideoRecordingsModule = class VideoRecordingsModule {
};
exports.VideoRecordingsModule = VideoRecordingsModule;
exports.VideoRecordingsModule = VideoRecordingsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([video_recording_entity_1.VideoRecording])],
        providers: [video_recordings_service_1.VideoRecordingsService],
        controllers: [video_recordings_controller_1.VideoRecordingsController],
        exports: [video_recordings_service_1.VideoRecordingsService],
    })
], VideoRecordingsModule);
//# sourceMappingURL=video-recordings.module.js.map