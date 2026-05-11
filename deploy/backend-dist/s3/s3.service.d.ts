import { Readable } from 'stream';
export declare class S3Service {
    private readonly logger;
    private readonly client;
    private readonly bucket;
    private readonly region;
    constructor();
    uploadBuffer(key: string, body: Buffer, contentType: string): Promise<string>;
    uploadStream(key: string, stream: Readable, contentType: string): Promise<string>;
    getPresignedUrl(key: string, expiresIn?: number): Promise<string>;
    getPublicUrl(key: string): string;
    deleteObject(key: string): Promise<void>;
    listKeys(prefix: string): Promise<string[]>;
    uploadImage(key: string, jpegBuffer: Buffer): Promise<string>;
    uploadVideo(key: string, mp4Buffer: Buffer): Promise<string>;
    uploadH264(key: string, h264Buffer: Buffer): Promise<string>;
}
