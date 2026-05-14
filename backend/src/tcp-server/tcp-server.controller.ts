import {
  Controller, Get, Post, Body, Param,
  UseGuards, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { TcpServerService } from './tcp-server.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VehicleControlCmd } from './jt808.parser';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class TcpServerController {
  constructor(private tcpServerService: TcpServerService) {}

  // ── Session info ────────────────────────────────────────────────────────────

  @Get('connected')
  getConnectedDevices() {
    return this.tcpServerService.getConnectedDevices();
  }

  // ── Vehicle control (0x8500) ────────────────────────────────────────────────
  // flags: use VehicleControlCmd bitmask
  // e.g. { "flags": 1 } = cut oil,  { "flags": 2 } = restore oil
  //      { "flags": 4 } = cut circuit, { "flags": 16 } = door lock
  @Post(':imei/control/vehicle')
  vehicleControl(
    @Param('imei') imei: string,
    @Body() body: { flags: number },
  ) {
    if (body.flags === undefined) throw new BadRequestException('flags required');
    const sent = this.tcpServerService.sendVehicleControl(imei, body.flags);
    if (!sent) throw new NotFoundException(`Device ${imei} not connected`);
    return { sent: true, flags: body.flags, flagNames: resolveControlFlags(body.flags) };
  }

  // ── Query current location (0x8201) ─────────────────────────────────────────
  @Post(':imei/control/query-location')
  queryLocation(@Param('imei') imei: string) {
    const sent = this.tcpServerService.sendQueryLocation(imei);
    if (!sent) throw new NotFoundException(`Device ${imei} not connected`);
    return { sent: true, note: 'Location will arrive as 0x0201 and be emitted via WebSocket' };
  }

  // ── Temporary tracking (0x8202) ──────────────────────────────────────────────
  // interval: reporting interval in seconds
  // validity: tracking duration in seconds (0 = cancel)
  @Post(':imei/control/temp-tracking')
  tempTracking(
    @Param('imei') imei: string,
    @Body() body: { interval: number; validity: number },
  ) {
    const sent = this.tcpServerService.sendTempTracking(imei, body.interval ?? 10, body.validity ?? 300);
    if (!sent) throw new NotFoundException(`Device ${imei} not connected`);
    return { sent: true };
  }

  // ── Set terminal parameters (0x8103) ─────────────────────────────────────────
  // params: array of { id: number (hex param ID), type: 'dword'|'word'|'byte'|'string', value: number|string }
  @Post(':imei/control/set-params')
  setParams(
    @Param('imei') imei: string,
    @Body() body: { params: Array<{ id: number; type: string; value: any }> },
  ) {
    if (!body.params?.length) throw new BadRequestException('params[] required');
    const params = body.params.map((p) => ({
      id: p.id,
      value: encodeParamValue(p.type, p.value),
    }));
    const sent = this.tcpServerService.sendSetParams(imei, params);
    if (!sent) throw new NotFoundException(`Device ${imei} not connected`);
    return { sent: true };
  }

  // ── Query terminal parameters (0x8104) ───────────────────────────────────────
  // paramIds: optional list of param IDs to query; empty = query all
  @Post(':imei/control/query-params')
  queryParams(
    @Param('imei') imei: string,
    @Body() body: { paramIds?: number[] },
  ) {
    const sent = this.tcpServerService.sendQueryParams(imei, body.paramIds);
    if (!sent) throw new NotFoundException(`Device ${imei} not connected`);
    return { sent: true, note: 'Params will arrive as 0x0104 and be emitted via WebSocket device_event' };
  }

  // ── Text message (0x8300) ────────────────────────────────────────────────────
  // flags: bit0=service,bit1=emergency,bit2=notice; text: UTF-8 string
  @Post(':imei/control/text')
  sendText(
    @Param('imei') imei: string,
    @Body() body: { text: string; flags?: number },
  ) {
    if (!body.text) throw new BadRequestException('text required');
    const sent = this.tcpServerService.sendTextMessage(imei, body.flags ?? 1, body.text);
    if (!sent) throw new NotFoundException(`Device ${imei} not connected`);
    return { sent: true };
  }

  // ── Terminal control (0x8105) ────────────────────────────────────────────────
  // cmd: 1=wireless upgrade,2=reboot,3=factory reset,4=close data link,5=close all links
  @Post(':imei/control/terminal')
  terminalControl(
    @Param('imei') imei: string,
    @Body() body: { cmd: number; param?: string },
  ) {
    if (body.cmd === undefined) throw new BadRequestException('cmd required');
    const sent = this.tcpServerService.sendTerminalControl(imei, body.cmd, body.param);
    if (!sent) throw new NotFoundException(`Device ${imei} not connected`);
    return { sent: true };
  }

  // ── Camera shoot (0x8801) ────────────────────────────────────────────────────
  // channel: 1-8; command: 0=single photo, 0xffff=stop video
  // interval: seconds between shots (0=single); savingFlag: 0=upload,1=save
  // resolution: 0=320×240,1=640×480,0xff=fullHD
  @Post(':imei/control/photo')
  takePhoto(
    @Param('imei') imei: string,
    @Body() body: {
      channel?: number;
      command?: number;
      interval?: number;
      savingFlag?: number;
      resolution?: number;
      quality?: number;
    },
  ) {
    const sent = this.tcpServerService.sendCameraShoot(
      imei,
      body.channel   ?? 1,
      body.command   ?? 0,
      body.interval  ?? 0,
      body.savingFlag ?? 0,
      body.resolution ?? 0xff,
      body.quality   ?? 8,
    );
    if (!sent) throw new NotFoundException(`Device ${imei} not connected`);
    return { sent: true };
  }

  // ── Real-time video request / JT1078 (0x9101) ───────────────────────────────
  // serverIp: platform media server IP the device should push RTP to
  // dataType: 0=audio+video,1=audio only,2=video only,3=bidirectional audio
  // streamType: 0=main stream,1=sub stream
  @Post(':imei/control/video')
  async requestVideo(
    @Param('imei') imei: string,
    @Body() body: {
      serverIp: string;
      serverTcpPort: number;
      serverUdpPort?: number;
      channel?: number;
      dataType?: number;
      streamType?: number;
    },
  ) {
    if (!body.serverIp || !body.serverTcpPort)
      throw new BadRequestException('serverIp and serverTcpPort required');

    // Try JT808 control channel (port 8808)
    const sent = await this.tcpServerService.sendRealtimeVideoRequest(
      imei,
      body.serverIp,
      body.serverTcpPort,
      body.serverUdpPort ?? body.serverTcpPort,
      body.channel    ?? 1,
      body.dataType   ?? 2,
      body.streamType ?? 0,
    );
    // If device is not on port 8808, it is connected to media port 8880 directly and
    // will receive 0x9101 automatically when it next authenticates there.
    return { sent, note: sent ? undefined : 'Device not on control port; stream will start automatically via media port' };
  }

  // ── Video stream control (0x9102) ────────────────────────────────────────────
  // command: 0=close,1=switch to main,2=switch to sub
  @Post(':imei/control/video-ctrl')
  videoControl(
    @Param('imei') imei: string,
    @Body() body: { channel: number; command: number; closeType?: number },
  ) {
    const sent = this.tcpServerService.sendVideoControl(imei, body.channel ?? 1, body.command, body.closeType);
    if (!sent) throw new NotFoundException(`Device ${imei} not connected`);
    return { sent: true };
  }

  // ── Historical video playback request (0x9201) ───────────────────────────────
  @Post(':imei/control/video-playback')
  histVideoRequest(
    @Param('imei') imei: string,
    @Body() body: {
      channel: number;
      mediaType?: number;
      streamType?: number;
      storageType?: number;
      playbackMode?: number;
      playbackSpeed?: number;
      startTime: string;
      endTime: string;
      serverIp: string;
      serverTcpPort: number;
      serverUdpPort?: number;
    },
  ) {
    if (!body.startTime || !body.endTime || !body.serverIp || !body.serverTcpPort)
      throw new BadRequestException('startTime, endTime, serverIp, serverTcpPort required');
    const sent = this.tcpServerService.sendHistVideoRequest(
      imei,
      body.channel      ?? 1,
      body.mediaType    ?? 0,
      body.streamType   ?? 0,
      body.storageType  ?? 0,
      body.playbackMode ?? 0,
      body.playbackSpeed ?? 0,
      new Date(body.startTime),
      new Date(body.endTime),
      body.serverIp,
      body.serverTcpPort,
      body.serverUdpPort ?? body.serverTcpPort,
    );
    if (!sent) throw new NotFoundException(`Device ${imei} not connected`);
    return { sent: true };
  }

  // ── File list query (0x9205) ─────────────────────────────────────────────────
  // Response arrives as WebSocket device_event 'multimedia_event'
  @Post(':imei/control/query-files')
  queryFiles(
    @Param('imei') imei: string,
    @Body() body: {
      channel?: number;
      startTime: string;
      endTime: string;
      alarmFlag?: number;
      mediaType?: number;
      storageType?: number;
    },
  ) {
    if (!body.startTime || !body.endTime)
      throw new BadRequestException('startTime and endTime required');
    const sent = this.tcpServerService.sendFileListQuery(
      imei,
      body.channel     ?? 0,
      new Date(body.startTime),
      new Date(body.endTime),
      body.alarmFlag   ?? 0,
      body.mediaType   ?? 0,
      body.storageType ?? 0,
    );
    if (!sent) throw new NotFoundException(`Device ${imei} not connected`);
    return { sent: true, note: 'File list will arrive via WebSocket device_event' };
  }

  // ── File upload control (0x9206) ─────────────────────────────────────────────
  @Post(':imei/control/upload-files')
  fileUploadControl(
    @Param('imei') imei: string,
    @Body() body: {
      serverIp: string;
      serverTcpPort: number;
      channel?: number;
      startTime: string;
      endTime: string;
      alarmFlag?: number;
      mediaType?: number;
      storageType?: number;
      taskId?: number;
      condition?: number;
    },
  ) {
    if (!body.serverIp || !body.serverTcpPort || !body.startTime || !body.endTime)
      throw new BadRequestException('serverIp, serverTcpPort, startTime, endTime required');
    const sent = this.tcpServerService.sendFileUploadControl(
      imei,
      body.serverIp,
      body.serverTcpPort,
      body.channel     ?? 1,
      new Date(body.startTime),
      new Date(body.endTime),
      body.alarmFlag   ?? 0,
      body.mediaType   ?? 0,
      body.storageType ?? 0,
      body.taskId      ?? 1,
      body.condition   ?? 0,
    );
    if (!sent) throw new NotFoundException(`Device ${imei} not connected`);
    return { sent: true };
  }

  // ── PTZ control (0x9301) ─────────────────────────────────────────────────────
  // cmd: 0x01=zoom-in,0x02=zoom-out,0x04=focus-in,0x08=focus-out,
  //      0x10=iris-open,0x20=iris-close,0x40=pan-up,0x80=pan-down
  @Post(':imei/control/ptz')
  ptzControl(
    @Param('imei') imei: string,
    @Body() body: { channel?: number; speed?: number; cmd: number },
  ) {
    if (body.cmd === undefined) throw new BadRequestException('cmd required');
    const sent = this.tcpServerService.sendPtzControl(
      imei,
      body.channel ?? 1,
      body.speed   ?? 0,
      body.cmd,
    );
    if (!sent) throw new NotFoundException(`Device ${imei} not connected`);
    return { sent: true };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveControlFlags(flags: number): string[] {
  const names: string[] = [];
  if (flags & VehicleControlCmd.CUT_OIL)        names.push('CUT_OIL');
  if (flags & VehicleControlCmd.RESTORE_OIL)    names.push('RESTORE_OIL');
  if (flags & VehicleControlCmd.CUT_CIRCUIT)    names.push('CUT_CIRCUIT');
  if (flags & VehicleControlCmd.RESTORE_CIRCUIT) names.push('RESTORE_CIRCUIT');
  if (flags & VehicleControlCmd.DOOR_LOCK)      names.push('DOOR_LOCK');
  if (flags & VehicleControlCmd.DOOR_UNLOCK)    names.push('DOOR_UNLOCK');
  return names;
}

function encodeParamValue(type: string, value: any): Buffer {
  switch (type) {
    case 'dword': { const b = Buffer.alloc(4); b.writeUInt32BE(Number(value), 0); return b; }
    case 'word':  { const b = Buffer.alloc(2); b.writeUInt16BE(Number(value), 0); return b; }
    case 'byte':  { const b = Buffer.alloc(1); b[0] = Number(value) & 0xff;       return b; }
    default:        return Buffer.from(String(value), 'utf8');
  }
}
