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
exports.VideoRecording = exports.RecordingStatus = exports.RecordingType = void 0;
const typeorm_1 = require("typeorm");
var RecordingType;
(function (RecordingType) {
    RecordingType["ALARM"] = "alarm";
    RecordingType["MANUAL"] = "manual";
    RecordingType["LIVE"] = "live";
})(RecordingType || (exports.RecordingType = RecordingType = {}));
var RecordingStatus;
(function (RecordingStatus) {
    RecordingStatus["PENDING"] = "pending";
    RecordingStatus["RECORDING"] = "recording";
    RecordingStatus["PROCESSING"] = "processing";
    RecordingStatus["COMPLETE"] = "complete";
    RecordingStatus["FAILED"] = "failed";
})(RecordingStatus || (exports.RecordingStatus = RecordingStatus = {}));
let VideoRecording = class VideoRecording {
    id;
    imei;
    deviceId;
    deviceName;
    channel;
    type;
    status;
    alarmType;
    alarmMessage;
    s3VideoKey;
    s3ImageKeys;
    videoUrl;
    imageUrls;
    durationSeconds;
    fileSizeBytes;
    latitude;
    longitude;
    speed;
    startTime;
    endTime;
    errorMessage;
    metadata;
    createdAt;
};
exports.VideoRecording = VideoRecording;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], VideoRecording.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], VideoRecording.prototype, "imei", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], VideoRecording.prototype, "deviceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], VideoRecording.prototype, "deviceName", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], VideoRecording.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: RecordingType, default: RecordingType.MANUAL }),
    __metadata("design:type", String)
], VideoRecording.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: RecordingStatus, default: RecordingStatus.PENDING }),
    __metadata("design:type", String)
], VideoRecording.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], VideoRecording.prototype, "alarmType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], VideoRecording.prototype, "alarmMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], VideoRecording.prototype, "s3VideoKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], VideoRecording.prototype, "s3ImageKeys", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], VideoRecording.prototype, "videoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], VideoRecording.prototype, "imageUrls", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], VideoRecording.prototype, "durationSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], VideoRecording.prototype, "fileSizeBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], VideoRecording.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], VideoRecording.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], VideoRecording.prototype, "speed", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], VideoRecording.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], VideoRecording.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], VideoRecording.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], VideoRecording.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], VideoRecording.prototype, "createdAt", void 0);
exports.VideoRecording = VideoRecording = __decorate([
    (0, typeorm_1.Entity)('video_recordings')
], VideoRecording);
//# sourceMappingURL=video-recording.entity.js.map