"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JT1078Parser = exports.SUB_PACKET = exports.DATA_TYPE = exports.PT = exports.JT1078_HEADER_LEN = exports.JT1078_MAGIC = void 0;
exports.JT1078_MAGIC = Buffer.from([0x30, 0x31, 0x63, 0x64]);
exports.JT1078_HEADER_LEN = 30;
exports.PT = {
    H264: 0x19,
    H265: 0x1a,
    AVS: 0x1b,
    G711A: 0x1c,
    G711U: 0x1d,
    G726: 0x1e,
    AAC: 0x1f,
    OPUS: 0x20,
};
exports.DATA_TYPE = {
    I_FRAME: 0,
    P_FRAME: 1,
    B_FRAME: 2,
    AUDIO: 3,
    PASSTHRU: 4,
};
exports.SUB_PACKET = {
    ATOMIC: 0,
    FIRST: 1,
    MIDDLE: 2,
    LAST: 3,
};
class JT1078Parser {
    static parsePacket(buf, offset = 0) {
        if (buf.length - offset < exports.JT1078_HEADER_LEN)
            return null;
        for (let i = 0; i < 4; i++) {
            if (buf[offset + i] !== exports.JT1078_MAGIC[i])
                return null;
        }
        // JT1078-2016 header layout (30 bytes from magic):
        // [0-3] magic | [4] V/P/X/CC | [5] M/PT | [6-7] SN | [8-13] SIM(6B BCD) |
        // [14] channel | [15] type byte | [16-23] timestamp(8B) |
        // [24-25] last-I-frame-interval | [26-27] last-frame-interval | [28-29] data-length
        const payloadType = buf[offset + 5] & 0x7f;
        const sequence = buf.readUInt16BE(offset + 6);
        const simNumber = buf
            .subarray(offset + 8, offset + 14)
            .toString('hex')
            .replace(/^0+/, '') || '0';
        const channel = buf[offset + 14];
        const typeByte = buf[offset + 15];
        const dataType = typeByte & 0x0f;
        const subPacketType = (typeByte >> 4) & 0x0f;
        const streamId = buf[offset + 4];
        const tsHi = buf.readUInt32BE(offset + 16);
        const tsLo = buf.readUInt32BE(offset + 20);
        const timestampMs = tsHi * 4294967296 + tsLo;
        const lastIFrameIntervalMs = buf.readUInt16BE(offset + 24);
        const lastFrameIntervalMs = buf.readUInt16BE(offset + 26);
        const dataLength = buf.readUInt16BE(offset + 28);
        if (buf.length - offset < exports.JT1078_HEADER_LEN + dataLength)
            return null;
        const data = buf.subarray(offset + exports.JT1078_HEADER_LEN, offset + exports.JT1078_HEADER_LEN + dataLength);
        return {
            simNumber,
            channel,
            dataType,
            subPacketType,
            payloadType,
            streamId,
            sequence,
            timestampMs,
            lastIFrameIntervalMs,
            lastFrameIntervalMs,
            dataLength,
            data,
        };
    }
    static packetLength(buf, offset = 0) {
        if (buf.length - offset < exports.JT1078_HEADER_LEN)
            return -1;
        const dataLength = buf.readUInt16BE(offset + 28);
        return exports.JT1078_HEADER_LEN + dataLength;
    }
    static isVideoFrame(p) {
        // Old non-standard format: dataType 0/1/2 = I/P/B frame
        if (p.dataType <= exports.DATA_TYPE.B_FRAME)
            return true;
        // JT1078-2016: detect H.264/H.265/AVS via RTP-style payload type
        return p.payloadType === 0x63 ||  // H.264 PT=99 (standard RTP)
               p.payloadType === exports.PT.H264 ||
               p.payloadType === exports.PT.H265 ||
               p.payloadType === exports.PT.AVS;
    }
    static isKeyFrame(p) {
        return p.dataType === exports.DATA_TYPE.I_FRAME || p.subPacketType === 0;
    }
    static isAudio(p) {
        return p.dataType === exports.DATA_TYPE.AUDIO && !JT1078Parser.isVideoFrame(p);
    }
    static toAnnexB(data) {
        if (!data || data.length === 0) return data;
        // Already Annex-B (3- or 4-byte start code)
        if ((data.length >= 4 && data[0] === 0 && data[1] === 0 && data[2] === 0 && data[3] === 1) ||
            (data.length >= 3 && data[0] === 0 && data[1] === 0 && data[2] === 1)) {
            return data;
        }
        // Try AVCC (4-byte big-endian length prefix, must fit in data)
        if (data.length >= 4) {
            const firstLen = data.readUInt32BE(0);
            if (firstLen > 0 && firstLen <= data.length - 4) {
                const parts = [];
                let i = 0;
                while (i + 4 <= data.length) {
                    const nalLen = data.readUInt32BE(i);
                    if (nalLen === 0 || i + 4 + nalLen > data.length) break;
                    i += 4;
                    parts.push(Buffer.from([0, 0, 0, 1]));
                    parts.push(data.subarray(i, i + nalLen));
                    i += nalLen;
                }
                if (parts.length) return Buffer.concat(parts);
            }
        }
        // Raw NAL unit — prepend Annex-B start code
        return Buffer.concat([Buffer.from([0, 0, 0, 1]), data]);
    }
    static payloadTypeName(pt) {
        for (const [k, v] of Object.entries(exports.PT)) {
            if (v === pt)
                return k;
        }
        return `PT_0x${pt.toString(16)}`;
    }
}
exports.JT1078Parser = JT1078Parser;
//# sourceMappingURL=jt1078.parser.js.map