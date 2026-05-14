// JT/T 1078 Media Packet Parser — T98 device format (26-byte header)
// [0-3]   Magic: 0x30 0x31 0x63 0x64
// [4]     RTP flags (V=2|P|X|CC)  e.g. 0x81
// [5]     RTP M|PT byte           e.g. 0x86 → M=1, PT=6 (video on this device)
// [6-7]   Packet sequence (uint16 BE)
// [8-13]  SIM BCD (6 bytes, 12-digit phone)
// [14]    Channel number (1-8)
// [15]    { subPacketType[7:4] | dataType[3:0] }
// [16-19] Timestamp in ms (uint32 BE)
// [20-23] Last I-frame timestamp in ms (uint32 BE)
// [24-25] Data length (uint16 BE)
// [26+]   Payload

export const JT1078_MAGIC = Buffer.from([0x30, 0x31, 0x63, 0x64]);
export const JT1078_HEADER_LEN = 26;

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

    // [4] RTP flags, [5] M|PT → extract PT from lower 7 bits
    const payloadType = buf[offset + 5] & 0x7f;
    const sequence    = buf.readUInt16BE(offset + 6);

    const simNumber = buf
      .subarray(offset + 8, offset + 14)
      .toString('hex')
      .replace(/^0+/, '') || '0';

    const channel       = buf[offset + 14];
    const typeByte      = buf[offset + 15];
    const dataType      = typeByte & 0x0f;
    const subPacketType = (typeByte >> 4) & 0x0f;

    const timestampMs          = buf.readUInt32BE(offset + 16);
    const lastIFrameIntervalMs = buf.readUInt32BE(offset + 20);
    const dataLength           = buf.readUInt16BE(offset + 24);

    if (buf.length - offset < JT1078_HEADER_LEN + dataLength) return null;

    const data = buf.subarray(offset + JT1078_HEADER_LEN, offset + JT1078_HEADER_LEN + dataLength);

    return {
      simNumber,
      channel,
      dataType,
      subPacketType,
      payloadType,
      streamId: 0,
      sequence,
      timestampMs,
      lastIFrameIntervalMs,
      lastFrameIntervalMs: 0,
      dataLength,
      data,
    };
  }

  /** Total byte length of this packet (header + payload) */
  static packetLength(buf: Buffer, offset = 0): number {
    if (buf.length - offset < JT1078_HEADER_LEN) return -1;
    const dataLength = buf.readUInt16BE(offset + 24);
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
