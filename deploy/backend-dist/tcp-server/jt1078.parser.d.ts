export declare const JT1078_MAGIC: Buffer<ArrayBuffer>;
export declare const JT1078_HEADER_LEN = 30;
export declare const PT: {
    readonly H264: 25;
    readonly H265: 26;
    readonly AVS: 27;
    readonly G711A: 28;
    readonly G711U: 29;
    readonly G726: 30;
    readonly AAC: 31;
    readonly OPUS: 32;
};
export declare const DATA_TYPE: {
    readonly I_FRAME: 0;
    readonly P_FRAME: 1;
    readonly B_FRAME: 2;
    readonly AUDIO: 3;
    readonly PASSTHRU: 4;
};
export declare const SUB_PACKET: {
    readonly ATOMIC: 0;
    readonly FIRST: 1;
    readonly MIDDLE: 2;
    readonly LAST: 3;
};
export interface JT1078Packet {
    simNumber: string;
    channel: number;
    dataType: number;
    subPacketType: number;
    payloadType: number;
    streamId: number;
    sequence: number;
    timestampMs: number;
    lastIFrameIntervalMs: number;
    lastFrameIntervalMs: number;
    dataLength: number;
    data: Buffer;
}
export declare class JT1078Parser {
    static parsePacket(buf: Buffer, offset?: number): JT1078Packet | null;
    static packetLength(buf: Buffer, offset?: number): number;
    static isVideoFrame(p: JT1078Packet): boolean;
    static isKeyFrame(p: JT1078Packet): boolean;
    static isAudio(p: JT1078Packet): boolean;
    static toAnnexB(data: Buffer): Buffer;
    static payloadTypeName(pt: number): string;
}
