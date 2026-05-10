// JT/T 1078-2016 Media Packet Parser
// Header: 30 bytes total
// [0-3]   Magic: 0x30 0x31 0x63 0x64
// [4-9]   SIM BCD (6 bytes, 12-digit phone)
// [10]    Channel number (1-8)
// [11]    { subPacketType[7:4] | dataType[3:0] }
// [12]    Payload type (PT)  0x19=H.264, 0x1A=H.265, 0x1C=G.711A, 0x1D=G.711U, 0x1E=G.726, 0x1F=AAC
// [13]    Stream ID
// [14-15] Packet sequence (uint16 BE)
// [16-23] Timestamp in ms (uint64 BE — read as two uint32 to avoid BigInt issues)
// [24-25] Last I-frame interval ms (uint16 BE)
// [26-27] Last frame interval ms (uint16 BE)
// [28-29] Data length (uint16 BE)
// [30+]   Payload

export const JT1078_MAGIC = Buffer.from([0x30, 0x31, 0x63, 0x64]);
export const JT1078_HEADER_LEN = 30;

export const PT = {
  H264:  0x19,
  H265:  0x1a,
  AVS:   0x1b,
  G711A: 0x1c,
  G711U: 0x1d,
  G726:  0x1e,
  AAC:   0x1f,
  OPUS:  0x20,
} as const;

export const DATA_TYPE = {
  I_FRAME:  0,  // H.264 IDR frame (key frame)
  P_FRAME:  1,  // Predicted frame
  B_FRAME:  2,  // Bi-directional frame
  AUDIO:    3,  // Audio frame
  PASSTHRU: 4,  // Transparent data
} as const;

export const SUB_PACKET = {
  ATOMIC: 0,  // Complete packet (not sub-divided)
  FIRST:  1,  // First sub-packet of a fragmented frame
  MIDDLE: 2,  // Middle sub-packet
  LAST:   3,  // Last sub-packet
} as const;

export interface JT1078Packet {
  simNumber: string;          // Device phone number (BCD decoded)
  channel: number;            // Logical channel 1-8
  dataType: number;           // DATA_TYPE.*
  subPacketType: number;      // SUB_PACKET.*
  payloadType: number;        // PT.*
  streamId: number;
  sequence: number;
  timestampMs: number;        // milliseconds (as JS number, safe for ~285 years)
  lastIFrameIntervalMs: number;
  lastFrameIntervalMs: number;
  dataLength: number;
  data: Buffer;               // raw payload
}

export class JT1078Parser {
  /** Parse one JT1078 packet from a buffer.
   *  Returns null if buffer is too short or magic doesn't match. */
  static parsePacket(buf: Buffer, offset = 0): JT1078Packet | null {
    if (buf.length - offset < JT1078_HEADER_LEN) return null;

    // Verify magic
    for (let i = 0; i < 4; i++) {
      if (buf[offset + i] !== JT1078_MAGIC[i]) return null;
    }

    const simNumber = buf
      .subarray(offset + 4, offset + 10)
      .toString('hex')
      .replace(/^0+/, '') || '0';

    const channel       = buf[offset + 10];
    const typeByte      = buf[offset + 11];
    const dataType      = typeByte & 0x0f;
    const subPacketType = (typeByte >> 4) & 0x0f;
    const payloadType   = buf[offset + 12];
    const streamId      = buf[offset + 13];
    const sequence      = buf.readUInt16BE(offset + 14);

    // Read 8-byte timestamp as two 32-bit values to stay in JS safe integer range
    const tsHi  = buf.readUInt32BE(offset + 16);
    const tsLo  = buf.readUInt32BE(offset + 20);
    // Combine: hi * 2^32 + lo — safe up to ~285 years of milliseconds
    const timestampMs = tsHi * 4294967296 + tsLo;

    const lastIFrameIntervalMs = buf.readUInt16BE(offset + 24);
    const lastFrameIntervalMs  = buf.readUInt16BE(offset + 26);
    const dataLength           = buf.readUInt16BE(offset + 28);

    if (buf.length - offset < JT1078_HEADER_LEN + dataLength) return null;

    const data = buf.subarray(offset + JT1078_HEADER_LEN, offset + JT1078_HEADER_LEN + dataLength);

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

  /** Total byte length of this packet (header + payload) */
  static packetLength(buf: Buffer, offset = 0): number {
    if (buf.length - offset < JT1078_HEADER_LEN) return -1;
    const dataLength = buf.readUInt16BE(offset + 28);
    return JT1078_HEADER_LEN + dataLength;
  }

  static isVideoFrame(p: JT1078Packet): boolean {
    return p.dataType <= DATA_TYPE.B_FRAME;
  }

  static isKeyFrame(p: JT1078Packet): boolean {
    return p.dataType === DATA_TYPE.I_FRAME;
  }

  static isAudio(p: JT1078Packet): boolean {
    return p.dataType === DATA_TYPE.AUDIO;
  }

  /** Ensure NAL data has Annex-B start codes (0x00 0x00 0x00 0x01).
   *  If the data is in AVCC format (4-byte length prefix), converts it. */
  static toAnnexB(data: Buffer): Buffer {
    // Check if already Annex-B
    if (
      (data.length >= 4 && data[0] === 0 && data[1] === 0 && data[2] === 0 && data[3] === 1) ||
      (data.length >= 3 && data[0] === 0 && data[1] === 0 && data[2] === 1)
    ) {
      return data;
    }
    // AVCC: convert each NAL
    const parts: Buffer[] = [];
    let i = 0;
    while (i + 4 <= data.length) {
      const nalLen = data.readUInt32BE(i);
      i += 4;
      if (i + nalLen > data.length) break;
      parts.push(Buffer.from([0, 0, 0, 1]));
      parts.push(data.subarray(i, i + nalLen));
      i += nalLen;
    }
    return parts.length ? Buffer.concat(parts) : data;
  }

  static payloadTypeName(pt: number): string {
    for (const [k, v] of Object.entries(PT)) {
      if (v === pt) return k;
    }
    return `PT_0x${pt.toString(16)}`;
  }
}
