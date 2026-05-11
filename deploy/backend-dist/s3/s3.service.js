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
exports.S3Service = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const lib_storage_1 = require("@aws-sdk/lib-storage");
let S3Service = class S3Service {
    logger = new common_1.Logger('S3Service');
    client;
    bucket;
    region;
    constructor() {
        this.region = process.env.AWS_REGION || 'us-east-1';
        this.bucket = process.env.AWS_S3_BUCKET || 'traxlogi-recordings';
        this.client = new client_s3_1.S3Client({
            region: this.region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
    }
    async uploadBuffer(key, body, contentType) {
        await this.client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        }));
        this.logger.log(`Uploaded s3://${this.bucket}/${key} (${body.length} bytes)`);
        return key;
    }
    async uploadStream(key, stream, contentType) {
        const upload = new lib_storage_1.Upload({
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
    async getPresignedUrl(key, expiresIn = 3600) {
        const cmd = new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key });
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, cmd, { expiresIn });
    }
    getPublicUrl(key) {
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }
    async deleteObject(key) {
        await this.client.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
        this.logger.log(`Deleted s3://${this.bucket}/${key}`);
    }
    async listKeys(prefix) {
        const res = await this.client.send(new client_s3_1.ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
        }));
        return (res.Contents || []).map((o) => o.Key).filter(Boolean);
    }
    async uploadImage(key, jpegBuffer) {
        return this.uploadBuffer(key, jpegBuffer, 'image/jpeg');
    }
    async uploadVideo(key, mp4Buffer) {
        return this.uploadBuffer(key, mp4Buffer, 'video/mp4');
    }
    async uploadH264(key, h264Buffer) {
        return this.uploadBuffer(key, h264Buffer, 'video/h264');
    }
};
exports.S3Service = S3Service;
exports.S3Service = S3Service = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], S3Service);
//# sourceMappingURL=s3.service.js.map