import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

@Injectable()
export class S3Service {
  private readonly logger = new Logger('S3Service');
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.AWS_S3_BUCKET || 'traxlogi-recordings';
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID     || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /** Upload a Buffer to S3. Returns the S3 key on success. */
  async uploadBuffer(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }));
    this.logger.log(`Uploaded s3://${this.bucket}/${key} (${body.length} bytes)`);
    return key;
  }

  /** Stream upload — best for large files (>5 MB). */
  async uploadStream(key: string, stream: Readable, contentType: string): Promise<string> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: stream,
        ContentType: contentType,
      },
    });
    await upload.done();
    this.logger.log(`Streamed to s3://${this.bucket}/${key}`);
    return key;
  }

  /** Generate a presigned URL valid for `expiresIn` seconds (default 1 hour). */
  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn });
  }

  /** Get the public HTTPS URL (only works if bucket is public). */
  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /** Delete an object. */
  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    this.logger.log(`Deleted s3://${this.bucket}/${key}`);
  }

  /** List all keys under a prefix. */
  async listKeys(prefix: string): Promise<string[]> {
    const res = await this.client.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    }));
    return (res.Contents || []).map((o) => o.Key!).filter(Boolean);
  }

  /** Convenience: upload JPEG image, returns S3 key. */
  async uploadImage(key: string, jpegBuffer: Buffer): Promise<string> {
    return this.uploadBuffer(key, jpegBuffer, 'image/jpeg');
  }

  /** Convenience: upload MP4 video, returns S3 key. */
  async uploadVideo(key: string, mp4Buffer: Buffer): Promise<string> {
    return this.uploadBuffer(key, mp4Buffer, 'video/mp4');
  }

  /** Convenience: upload raw H.264 Annex-B, returns S3 key. */
  async uploadH264(key: string, h264Buffer: Buffer): Promise<string> {
    return this.uploadBuffer(key, h264Buffer, 'video/h264');
  }
}
