import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { VideoRecording, RecordingType, RecordingStatus } from './video-recording.entity';
import { S3Service } from '../s3/s3.service';

export interface PendingCapture {
  recordingId: number;
  imei: string;
  alarmType: string;
  startedAt: Date;
  photoCount: number;         // how many photos have been uploaded
  targetPhotoCount: number;   // 3 for alarm capture
  recordingStartedAt?: Date;  // when the video stream started
}

@Injectable()
export class VideoRecordingsService {
  private readonly logger = new Logger('VideoRecordingsService');

  // Track in-flight alarm captures: imei → PendingCapture
  private readonly pendingCaptures = new Map<string, PendingCapture>();

  constructor(
    @InjectRepository(VideoRecording)
    private repo: Repository<VideoRecording>,
    private s3: S3Service,
  ) {}

  // ─── Alarm Capture ─────────────────────────────────────────────────────────

  /** Called when an alarm is detected. Creates a DB record and registers
   *  a pending capture so incoming photos/video get linked automatically. */
  async createAlarmRecording(
    imei: string,
    deviceId: number,
    deviceName: string,
    alarmType: string,
    alarmMessage: string,
    location: { latitude?: number; longitude?: number; speed?: number },
  ): Promise<VideoRecording> {
    const recording = await this.repo.save(
      this.repo.create({
        imei,
        deviceId,
        deviceName,
        channel: 1,
        type: RecordingType.ALARM,
        status: RecordingStatus.PENDING,
        alarmType,
        alarmMessage,
        startTime: new Date(),
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed,
        s3ImageKeys: [],
        durationSeconds: 10,
      }),
    );

    this.pendingCaptures.set(imei, {
      recordingId: recording.id,
      imei,
      alarmType,
      startedAt: new Date(),
      photoCount: 0,
      targetPhotoCount: 3,
    });

    // Auto-expire the pending capture after 60 seconds if device never responds
    setTimeout(() => {
      const capture = this.pendingCaptures.get(imei);
      if (capture && capture.recordingId === recording.id) {
        this.pendingCaptures.delete(imei);
      }
    }, 60_000);

    this.logger.log(`Alarm recording created: id=${recording.id} imei=${imei} type=${alarmType}`);
    return recording;
  }

  /** Called from TcpServerService when a 0x0801 multimedia upload arrives.
   *  If there's a pending alarm capture for this device, saves the photo to S3. */
  async handleIncomingPhoto(imei: string, jpegBuffer: Buffer, localFilename: string): Promise<void> {
    const capture = this.pendingCaptures.get(imei);
    if (!capture) return;  // not an alarm capture, nothing to do

    capture.photoCount++;
    const photoNum = capture.photoCount;
    const s3Key = `recordings/${imei}/alarm_${capture.recordingId}/photo_${photoNum}.jpg`;

    try {
      await this.s3.uploadImage(s3Key, jpegBuffer);

      // Load current recording and append the new key
      const recording = await this.repo.findOne({ where: { id: capture.recordingId } });
      if (recording) {
        const keys = recording.s3ImageKeys || [];
        keys.push(s3Key);
        await this.repo.update(recording.id, { s3ImageKeys: keys });
      }
      this.logger.log(`Alarm photo ${photoNum}/${capture.targetPhotoCount} uploaded: ${s3Key}`);
    } catch (err: any) {
      this.logger.error(`Failed to upload alarm photo: ${err.message}`);
    }
  }

  /** Called by MediaServerService when a recording stream starts. */
  markRecordingStarted(imei: string): number | null {
    const capture = this.pendingCaptures.get(imei);
    if (!capture) return null;
    capture.recordingStartedAt = new Date();
    this.repo.update(capture.recordingId, { status: RecordingStatus.RECORDING }).catch(() => {});
    return capture.recordingId;
  }

  /** Called by MediaServerService when an H.264 recording is complete.
   *  Uploads the MP4 buffer to S3 and marks the recording complete. */
  async finalizeVideoRecording(
    imei: string,
    mp4Buffer: Buffer,
    durationSeconds: number,
  ): Promise<void> {
    const capture = this.pendingCaptures.get(imei);
    if (!capture) return;

    const s3Key = `recordings/${imei}/alarm_${capture.recordingId}/video.mp4`;
    try {
      await this.repo.update(capture.recordingId, { status: RecordingStatus.PROCESSING });
      await this.s3.uploadVideo(s3Key, mp4Buffer);
      await this.repo.update(capture.recordingId, {
        status: RecordingStatus.COMPLETE,
        s3VideoKey: s3Key,
        endTime: new Date(),
        durationSeconds,
        fileSizeBytes: mp4Buffer.length,
      });
      this.logger.log(`Alarm video uploaded: ${s3Key} (${mp4Buffer.length} bytes)`);
    } catch (err: any) {
      await this.repo.update(capture.recordingId, {
        status: RecordingStatus.FAILED,
        errorMessage: err.message,
      });
      this.logger.error(`Failed to finalize alarm video: ${err.message}`);
    } finally {
      this.pendingCaptures.delete(imei);
    }
  }

  /** Finalise raw G.711A A-law audio recording — saves .alaw directly. */
  async finalizeRawAlawRecording(imei: string, alawBuffer: Buffer, durationSeconds: number): Promise<void> {
    const capture = this.pendingCaptures.get(imei);
    if (!capture) return;

    const s3Key = `recordings/${imei}/alarm_${capture.recordingId}/audio.alaw`;
    try {
      await this.repo.update(capture.recordingId, { status: RecordingStatus.PROCESSING });
      await this.s3.uploadBuffer(s3Key, alawBuffer, 'audio/x-alaw');
      await this.repo.update(capture.recordingId, {
        status: RecordingStatus.COMPLETE,
        s3VideoKey: s3Key,
        endTime: new Date(),
        durationSeconds,
        fileSizeBytes: alawBuffer.length,
      });
      this.logger.log(`Audio recording uploaded: ${s3Key} (${alawBuffer.length}b, ${durationSeconds}s)`);
    } catch (err: any) {
      await this.repo.update(capture.recordingId, {
        status: RecordingStatus.FAILED,
        errorMessage: err.message,
      });
      this.logger.error(`Failed to finalize audio recording: ${err.message}`);
    } finally {
      this.pendingCaptures.delete(imei);
    }
  }

  /** Finalise raw H.264 (no ffmpeg) — saves .h264 directly. */
  async finalizeRawH264Recording(imei: string, h264Buffer: Buffer, durationSeconds: number): Promise<void> {
    const capture = this.pendingCaptures.get(imei);
    if (!capture) return;

    const s3Key = `recordings/${imei}/alarm_${capture.recordingId}/video.h264`;
    try {
      await this.repo.update(capture.recordingId, { status: RecordingStatus.PROCESSING });
      await this.s3.uploadH264(s3Key, h264Buffer);
      await this.repo.update(capture.recordingId, {
        status: RecordingStatus.COMPLETE,
        s3VideoKey: s3Key,
        endTime: new Date(),
        durationSeconds,
        fileSizeBytes: h264Buffer.length,
      });
    } catch (err: any) {
      await this.repo.update(capture.recordingId, {
        status: RecordingStatus.FAILED,
        errorMessage: err.message,
      });
    } finally {
      this.pendingCaptures.delete(imei);
    }
  }

  // ─── Live Recording ─────────────────────────────────────────────────────────

  /** Called by MediaServerService when a live stream starts (no pending alarm). */
  async startLiveRecording(
    simNumber: string, deviceId: number, deviceName: string, channel: number,
  ): Promise<number> {
    const recording = await this.repo.save(
      this.repo.create({
        imei: simNumber,
        deviceId,
        deviceName,
        channel,
        type: RecordingType.LIVE,
        status: RecordingStatus.RECORDING,
        startTime: new Date(),
        s3ImageKeys: [],
      }),
    );
    this.pendingCaptures.set(simNumber, {
      recordingId: recording.id,
      imei: simNumber,
      alarmType: 'live',
      startedAt: new Date(),
      photoCount: 0,
      targetPhotoCount: 0,
      recordingStartedAt: new Date(),
    });
    this.logger.log(`Live recording created: id=${recording.id} sim=${simNumber} ch=${channel}`);
    return recording.id;
  }

  // ─── Manual Recording ───────────────────────────────────────────────────────

  async createManualRecording(
    imei: string, deviceId: number, deviceName: string, channel: number,
  ): Promise<VideoRecording> {
    const recording = await this.repo.save(
      this.repo.create({
        imei, deviceId, deviceName, channel,
        type: RecordingType.MANUAL,
        status: RecordingStatus.PENDING,
        startTime: new Date(),
        s3ImageKeys: [],
      }),
    );
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

  async finalizeManualRecording(imei: string, mp4Buffer: Buffer, durationSeconds: number): Promise<void> {
    return this.finalizeVideoRecording(imei, mp4Buffer, durationSeconds);
  }

  // ─── Query API ──────────────────────────────────────────────────────────────

  async findAll(filters: {
    imei?: string;
    deviceId?: number;
    type?: RecordingType;
    status?: RecordingStatus;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{ items: VideoRecording[]; total: number }> {
    const where: FindOptionsWhere<VideoRecording> = {};
    if (filters.imei)     where.imei     = filters.imei;
    if (filters.deviceId) where.deviceId = filters.deviceId;
    if (filters.type)     where.type     = filters.type;
    if (filters.status)   where.status   = filters.status;
    if (filters.from && filters.to) {
      where.startTime = Between(filters.from, filters.to);
    }

    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 20;
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  async findOne(id: number): Promise<VideoRecording> {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException(`Recording ${id} not found`);
    return r;
  }

  /** Get one recording with fresh presigned URLs for video + images. */
  async findOneWithUrls(id: number): Promise<VideoRecording & { videoUrl?: string; imageUrls?: string[] }> {
    const r = await this.findOne(id);
    const result: any = { ...r };
    if (r.s3VideoKey) {
      try { result.videoUrl = await this.s3.getPresignedUrl(r.s3VideoKey, 3600); } catch { /* ignore */ }
    }
    if (r.s3ImageKeys?.length) {
      result.imageUrls = await Promise.all(
        r.s3ImageKeys.map((k) => this.s3.getPresignedUrl(k, 3600).catch(() => '')),
      );
    }
    return result;
  }

  async remove(id: number): Promise<void> {
    const r = await this.findOne(id);
    if (r.s3VideoKey) await this.s3.deleteObject(r.s3VideoKey).catch(() => {});
    for (const key of r.s3ImageKeys || []) {
      await this.s3.deleteObject(key).catch(() => {});
    }
    await this.repo.remove(r);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Returns the pending capture for a device (for MediaServerService to use). */
  getPendingCapture(imei: string): PendingCapture | undefined {
    return this.pendingCaptures.get(imei);
  }

  hasPendingCapture(imei: string): boolean {
    return this.pendingCaptures.has(imei);
  }
}
