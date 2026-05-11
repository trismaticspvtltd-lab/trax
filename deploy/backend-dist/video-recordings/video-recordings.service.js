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
exports.VideoRecordingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const video_recording_entity_1 = require("./video-recording.entity");
const s3_service_1 = require("../s3/s3.service");
let VideoRecordingsService = class VideoRecordingsService {
    repo;
    s3;
    logger = new common_1.Logger('VideoRecordingsService');
    pendingCaptures = new Map();
    constructor(repo, s3) {
        this.repo = repo;
        this.s3 = s3;
    }
    async createAlarmRecording(imei, deviceId, deviceName, alarmType, alarmMessage, location) {
        const recording = await this.repo.save(this.repo.create({
            imei,
            deviceId,
            deviceName,
            channel: 1,
            type: video_recording_entity_1.RecordingType.ALARM,
            status: video_recording_entity_1.RecordingStatus.PENDING,
            alarmType,
            alarmMessage,
            startTime: new Date(),
            latitude: location.latitude,
            longitude: location.longitude,
            speed: location.speed,
            s3ImageKeys: [],
            durationSeconds: 10,
        }));
        this.pendingCaptures.set(imei, {
            recordingId: recording.id,
            imei,
            alarmType,
            startedAt: new Date(),
            photoCount: 0,
            targetPhotoCount: 3,
        });
        setTimeout(() => {
            const capture = this.pendingCaptures.get(imei);
            if (capture && capture.recordingId === recording.id) {
                this.pendingCaptures.delete(imei);
            }
        }, 60_000);
        this.logger.log(`Alarm recording created: id=${recording.id} imei=${imei} type=${alarmType}`);
        return recording;
    }
    async handleIncomingPhoto(imei, jpegBuffer, localFilename) {
        const capture = this.pendingCaptures.get(imei);
        if (!capture)
            return;
        capture.photoCount++;
        const photoNum = capture.photoCount;
        const s3Key = `recordings/${imei}/alarm_${capture.recordingId}/photo_${photoNum}.jpg`;
        try {
            await this.s3.uploadImage(s3Key, jpegBuffer);
            const recording = await this.repo.findOne({ where: { id: capture.recordingId } });
            if (recording) {
                const keys = recording.s3ImageKeys || [];
                keys.push(s3Key);
                await this.repo.update(recording.id, { s3ImageKeys: keys });
            }
            this.logger.log(`Alarm photo ${photoNum}/${capture.targetPhotoCount} uploaded: ${s3Key}`);
        }
        catch (err) {
            this.logger.error(`Failed to upload alarm photo: ${err.message}`);
        }
    }
    markRecordingStarted(imei) {
        const capture = this.pendingCaptures.get(imei);
        if (!capture)
            return null;
        capture.recordingStartedAt = new Date();
        this.repo.update(capture.recordingId, { status: video_recording_entity_1.RecordingStatus.RECORDING }).catch(() => { });
        return capture.recordingId;
    }
    async finalizeVideoRecording(imei, mp4Buffer, durationSeconds) {
        const capture = this.pendingCaptures.get(imei);
        if (!capture)
            return;
        const s3Key = `recordings/${imei}/alarm_${capture.recordingId}/video.mp4`;
        try {
            await this.repo.update(capture.recordingId, { status: video_recording_entity_1.RecordingStatus.PROCESSING });
            await this.s3.uploadVideo(s3Key, mp4Buffer);
            await this.repo.update(capture.recordingId, {
                status: video_recording_entity_1.RecordingStatus.COMPLETE,
                s3VideoKey: s3Key,
                endTime: new Date(),
                durationSeconds,
                fileSizeBytes: mp4Buffer.length,
            });
            this.logger.log(`Alarm video uploaded: ${s3Key} (${mp4Buffer.length} bytes)`);
        }
        catch (err) {
            await this.repo.update(capture.recordingId, {
                status: video_recording_entity_1.RecordingStatus.FAILED,
                errorMessage: err.message,
            });
            this.logger.error(`Failed to finalize alarm video: ${err.message}`);
        }
        finally {
            this.pendingCaptures.delete(imei);
        }
    }
    async finalizeRawH264Recording(imei, h264Buffer, durationSeconds) {
        const capture = this.pendingCaptures.get(imei);
        if (!capture)
            return;
        const s3Key = `recordings/${imei}/alarm_${capture.recordingId}/video.h264`;
        try {
            await this.repo.update(capture.recordingId, { status: video_recording_entity_1.RecordingStatus.PROCESSING });
            await this.s3.uploadH264(s3Key, h264Buffer);
            await this.repo.update(capture.recordingId, {
                status: video_recording_entity_1.RecordingStatus.COMPLETE,
                s3VideoKey: s3Key,
                endTime: new Date(),
                durationSeconds,
                fileSizeBytes: h264Buffer.length,
            });
        }
        catch (err) {
            await this.repo.update(capture.recordingId, {
                status: video_recording_entity_1.RecordingStatus.FAILED,
                errorMessage: err.message,
            });
        }
        finally {
            this.pendingCaptures.delete(imei);
        }
    }
    async createManualRecording(imei, deviceId, deviceName, channel) {
        const recording = await this.repo.save(this.repo.create({
            imei, deviceId, deviceName, channel,
            type: video_recording_entity_1.RecordingType.MANUAL,
            status: video_recording_entity_1.RecordingStatus.PENDING,
            startTime: new Date(),
            s3ImageKeys: [],
        }));
        this.pendingCaptures.set(imei, {
            recordingId: recording.id,
            imei,
            alarmType: 'manual',
            startedAt: new Date(),
            photoCount: 0,
            targetPhotoCount: 0,
        });
        return recording;
    }
    async finalizeManualRecording(imei, mp4Buffer, durationSeconds) {
        return this.finalizeVideoRecording(imei, mp4Buffer, durationSeconds);
    }
    async findAll(filters = {}) {
        const where = {};
        if (filters.imei)
            where.imei = filters.imei;
        if (filters.deviceId)
            where.deviceId = filters.deviceId;
        if (filters.type)
            where.type = filters.type;
        if (filters.status)
            where.status = filters.status;
        if (filters.from && filters.to) {
            where.startTime = (0, typeorm_2.Between)(filters.from, filters.to);
        }
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const [items, total] = await this.repo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total };
    }
    async findOne(id) {
        const r = await this.repo.findOne({ where: { id } });
        if (!r)
            throw new common_1.NotFoundException(`Recording ${id} not found`);
        return r;
    }
    async findOneWithUrls(id) {
        const r = await this.findOne(id);
        const result = { ...r };
        if (r.s3VideoKey) {
            try {
                result.videoUrl = await this.s3.getPresignedUrl(r.s3VideoKey, 3600);
            }
            catch { }
        }
        if (r.s3ImageKeys?.length) {
            result.imageUrls = await Promise.all(r.s3ImageKeys.map((k) => this.s3.getPresignedUrl(k, 3600).catch(() => '')));
        }
        return result;
    }
    async remove(id) {
        const r = await this.findOne(id);
        if (r.s3VideoKey)
            await this.s3.deleteObject(r.s3VideoKey).catch(() => { });
        for (const key of r.s3ImageKeys || []) {
            await this.s3.deleteObject(key).catch(() => { });
        }
        await this.repo.remove(r);
    }
    getPendingCapture(imei) {
        return this.pendingCaptures.get(imei);
    }
    hasPendingCapture(imei) {
        return this.pendingCaptures.has(imei);
    }
};
exports.VideoRecordingsService = VideoRecordingsService;
exports.VideoRecordingsService = VideoRecordingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(video_recording_entity_1.VideoRecording)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        s3_service_1.S3Service])
], VideoRecordingsService);
//# sourceMappingURL=video-recordings.service.js.map