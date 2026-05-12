"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JT808Parser = exports.VehicleControlCmd = exports.ParamId = exports.MsgId = void 0;
var MsgId;
(function (MsgId) {
    MsgId[MsgId["TERMINAL_GENERAL_RESPONSE"] = 1] = "TERMINAL_GENERAL_RESPONSE";
    MsgId[MsgId["HEARTBEAT"] = 2] = "HEARTBEAT";
    MsgId[MsgId["TERMINAL_DEREGISTER"] = 3] = "TERMINAL_DEREGISTER";
    MsgId[MsgId["TERMINAL_REGISTER"] = 256] = "TERMINAL_REGISTER";
    MsgId[MsgId["TERMINAL_PARAMS_RESPONSE"] = 260] = "TERMINAL_PARAMS_RESPONSE";
    MsgId[MsgId["TERMINAL_PROPS_RESPONSE"] = 263] = "TERMINAL_PROPS_RESPONSE";
    MsgId[MsgId["UPGRADE_RESULT"] = 264] = "UPGRADE_RESULT";
    MsgId[MsgId["TERMINAL_AUTH"] = 258] = "TERMINAL_AUTH";
    MsgId[MsgId["LOCATION_REPORT"] = 512] = "LOCATION_REPORT";
    MsgId[MsgId["LOCATION_QUERY_RESPONSE"] = 513] = "LOCATION_QUERY_RESPONSE";
    MsgId[MsgId["LOCATION_BULK"] = 1796] = "LOCATION_BULK";
    MsgId[MsgId["EVENT_REPORT"] = 769] = "EVENT_REPORT";
    MsgId[MsgId["QUESTION_ANSWER"] = 770] = "QUESTION_ANSWER";
    MsgId[MsgId["INFO_ON_DEMAND"] = 771] = "INFO_ON_DEMAND";
    MsgId[MsgId["DRIVER_IDENTITY"] = 1794] = "DRIVER_IDENTITY";
    MsgId[MsgId["TACHOGRAPH_DATA"] = 1792] = "TACHOGRAPH_DATA";
    MsgId[MsgId["ELEC_WAYBILL"] = 1793] = "ELEC_WAYBILL";
    MsgId[MsgId["CAN_BUS_DATA"] = 1797] = "CAN_BUS_DATA";
    MsgId[MsgId["MULTIMEDIA_EVENT"] = 2048] = "MULTIMEDIA_EVENT";
    MsgId[MsgId["MULTIMEDIA_DATA"] = 2049] = "MULTIMEDIA_DATA";
    MsgId[MsgId["MULTIMEDIA_SEARCH_RESPONSE"] = 2050] = "MULTIMEDIA_SEARCH_RESPONSE";
    MsgId[MsgId["VEHICLE_CONTROL_RESPONSE"] = 1280] = "VEHICLE_CONTROL_RESPONSE";
    MsgId[MsgId["RSA_KEY"] = 2560] = "RSA_KEY";
    MsgId[MsgId["VIDEO_STREAM_SUBSCRIBE"] = 4101] = "VIDEO_STREAM_SUBSCRIBE";
    MsgId[MsgId["HISTORICAL_STREAM_CONTROL"] = 4614] = "HISTORICAL_STREAM_CONTROL";
    MsgId[MsgId["FILE_UPLOAD_COMPLETE"] = 4613] = "FILE_UPLOAD_COMPLETE";
    MsgId[MsgId["ALARM_ATTACH_UPLOAD"] = 4624] = "ALARM_ATTACH_UPLOAD";
    MsgId[MsgId["CAMERA_SHOOT_RESPONSE"] = 4614] = "CAMERA_SHOOT_RESPONSE";
    MsgId[MsgId["PLATFORM_GENERAL_RESPONSE"] = 32769] = "PLATFORM_GENERAL_RESPONSE";
    MsgId[MsgId["RESEND_PACKET"] = 32771] = "RESEND_PACKET";
    MsgId[MsgId["TERMINAL_REGISTER_RESPONSE"] = 33024] = "TERMINAL_REGISTER_RESPONSE";
    MsgId[MsgId["SET_TERMINAL_PARAMS"] = 33027] = "SET_TERMINAL_PARAMS";
    MsgId[MsgId["QUERY_TERMINAL_PARAMS"] = 33028] = "QUERY_TERMINAL_PARAMS";
    MsgId[MsgId["TERMINAL_CONTROL"] = 33029] = "TERMINAL_CONTROL";
    MsgId[MsgId["UPGRADE_PACKAGE"] = 33032] = "UPGRADE_PACKAGE";
    MsgId[MsgId["QUERY_LOCATION"] = 33281] = "QUERY_LOCATION";
    MsgId[MsgId["TEMP_LOCATION_TRACKING"] = 33282] = "TEMP_LOCATION_TRACKING";
    MsgId[MsgId["TEXT_MESSAGE"] = 33536] = "TEXT_MESSAGE";
    MsgId[MsgId["SET_EVENTS"] = 33537] = "SET_EVENTS";
    MsgId[MsgId["ISSUE_QUESTION"] = 33538] = "ISSUE_QUESTION";
    MsgId[MsgId["INFO_MENU_SETTING"] = 33539] = "INFO_MENU_SETTING";
    MsgId[MsgId["CALL_BACK"] = 33792] = "CALL_BACK";
    MsgId[MsgId["SET_PHONEBOOK"] = 33793] = "SET_PHONEBOOK";
    MsgId[MsgId["VEHICLE_CONTROL"] = 34048] = "VEHICLE_CONTROL";
    MsgId[MsgId["SET_CIRCLE_AREA"] = 34304] = "SET_CIRCLE_AREA";
    MsgId[MsgId["DELETE_CIRCLE_AREA"] = 34305] = "DELETE_CIRCLE_AREA";
    MsgId[MsgId["SET_RECT_AREA"] = 34306] = "SET_RECT_AREA";
    MsgId[MsgId["DELETE_RECT_AREA"] = 34307] = "DELETE_RECT_AREA";
    MsgId[MsgId["SET_POLYGON_AREA"] = 34308] = "SET_POLYGON_AREA";
    MsgId[MsgId["DELETE_POLYGON_AREA"] = 34309] = "DELETE_POLYGON_AREA";
    MsgId[MsgId["SET_ROUTE"] = 34310] = "SET_ROUTE";
    MsgId[MsgId["DELETE_ROUTE"] = 34311] = "DELETE_ROUTE";
    MsgId[MsgId["QUERY_LOCATION_AREA_ROUTE"] = 34312] = "QUERY_LOCATION_AREA_ROUTE";
    MsgId[MsgId["DRIVING_RECORD_DATA_COLLECT"] = 34560] = "DRIVING_RECORD_DATA_COLLECT";
    MsgId[MsgId["MULTIMEDIA_UPLOAD_RESPONSE"] = 34816] = "MULTIMEDIA_UPLOAD_RESPONSE";
    MsgId[MsgId["CAMERA_SHOOT"] = 34817] = "CAMERA_SHOOT";
    MsgId[MsgId["MULTIMEDIA_SEARCH"] = 34818] = "MULTIMEDIA_SEARCH";
    MsgId[MsgId["RECORDING"] = 34820] = "RECORDING";
    MsgId[MsgId["MULTIMEDIA_SINGLE_UPLOAD"] = 34821] = "MULTIMEDIA_SINGLE_UPLOAD";
    MsgId[MsgId["RSA_PUBKEY"] = 35328] = "RSA_PUBKEY";
    MsgId[MsgId["REALTIME_VIDEO_REQUEST"] = 37121] = "REALTIME_VIDEO_REQUEST";
    MsgId[MsgId["REALTIME_VIDEO_CONTROL"] = 37122] = "REALTIME_VIDEO_CONTROL";
    MsgId[MsgId["REALTIME_VIDEO_SWITCH"] = 37123] = "REALTIME_VIDEO_SWITCH";
    MsgId[MsgId["HIST_VIDEO_PLAYBACK_REQ"] = 37377] = "HIST_VIDEO_PLAYBACK_REQ";
    MsgId[MsgId["HIST_VIDEO_PLAYBACK_CTRL"] = 37378] = "HIST_VIDEO_PLAYBACK_CTRL";
    MsgId[MsgId["FILE_LIST_QUERY"] = 37381] = "FILE_LIST_QUERY";
    MsgId[MsgId["FILE_UPLOAD_CONTROL"] = 37382] = "FILE_UPLOAD_CONTROL";
    MsgId[MsgId["PUSH_VEHICLE_ALARM"] = 37384] = "PUSH_VEHICLE_ALARM";
    MsgId[MsgId["PTZ_CONTROL"] = 37633] = "PTZ_CONTROL";
    MsgId[MsgId["CAMERA_PARAM_QUERY"] = 37634] = "CAMERA_PARAM_QUERY";
    MsgId[MsgId["CAMERA_PARAM_RESPONSE"] = 37635] = "CAMERA_PARAM_RESPONSE";
    MsgId[MsgId["CAMERA_RECORD_CONTROL"] = 37636] = "CAMERA_RECORD_CONTROL";
    MsgId[MsgId["STORAGE_MEDIA_QUERY"] = 37637] = "STORAGE_MEDIA_QUERY";
    MsgId[MsgId["STORAGE_MEDIA_QUERY_RESPONSE"] = 37638] = "STORAGE_MEDIA_QUERY_RESPONSE";
})(MsgId || (exports.MsgId = MsgId = {}));
var ParamId;
(function (ParamId) {
    ParamId[ParamId["HEARTBEAT_INTERVAL"] = 1] = "HEARTBEAT_INTERVAL";
    ParamId[ParamId["TCP_RESPONSE_TIMEOUT"] = 2] = "TCP_RESPONSE_TIMEOUT";
    ParamId[ParamId["TCP_RESEND_COUNT"] = 3] = "TCP_RESEND_COUNT";
    ParamId[ParamId["UDP_RESPONSE_TIMEOUT"] = 4] = "UDP_RESPONSE_TIMEOUT";
    ParamId[ParamId["UDP_RESEND_COUNT"] = 5] = "UDP_RESEND_COUNT";
    ParamId[ParamId["SMS_RESPONSE_TIMEOUT"] = 6] = "SMS_RESPONSE_TIMEOUT";
    ParamId[ParamId["SMS_RESEND_COUNT"] = 7] = "SMS_RESEND_COUNT";
    ParamId[ParamId["MAIN_SERVER_APN"] = 16] = "MAIN_SERVER_APN";
    ParamId[ParamId["MAIN_SERVER_USER"] = 17] = "MAIN_SERVER_USER";
    ParamId[ParamId["MAIN_SERVER_PASS"] = 18] = "MAIN_SERVER_PASS";
    ParamId[ParamId["MAIN_SERVER_IP"] = 19] = "MAIN_SERVER_IP";
    ParamId[ParamId["BACKUP_SERVER_APN"] = 22] = "BACKUP_SERVER_APN";
    ParamId[ParamId["BACKUP_SERVER_IP"] = 23] = "BACKUP_SERVER_IP";
    ParamId[ParamId["SERVER_TCP_PORT"] = 24] = "SERVER_TCP_PORT";
    ParamId[ParamId["SERVER_UDP_PORT"] = 25] = "SERVER_UDP_PORT";
    ParamId[ParamId["IC_CARD_REPORTING"] = 26] = "IC_CARD_REPORTING";
    ParamId[ParamId["REPORT_INTERVAL"] = 32] = "REPORT_INTERVAL";
    ParamId[ParamId["REPORT_INTERVAL_DORMANT"] = 33] = "REPORT_INTERVAL_DORMANT";
    ParamId[ParamId["REPORT_INTERVAL_ALARM"] = 34] = "REPORT_INTERVAL_ALARM";
    ParamId[ParamId["OVERSPEED_THRESHOLD"] = 85] = "OVERSPEED_THRESHOLD";
    ParamId[ParamId["OVERSPEED_DURATION"] = 86] = "OVERSPEED_DURATION";
    ParamId[ParamId["CONTINUOUS_DRIVE_LIMIT"] = 87] = "CONTINUOUS_DRIVE_LIMIT";
    ParamId[ParamId["DAY_DRIVE_LIMIT"] = 88] = "DAY_DRIVE_LIMIT";
    ParamId[ParamId["MIN_REST_TIME"] = 89] = "MIN_REST_TIME";
    ParamId[ParamId["MAX_PARK_TIME"] = 90] = "MAX_PARK_TIME";
    ParamId[ParamId["OVERSPEED_ALARM_DIFF"] = 91] = "OVERSPEED_ALARM_DIFF";
    ParamId[ParamId["FATIGUE_ALARM_DIFF"] = 92] = "FATIGUE_ALARM_DIFF";
    ParamId[ParamId["COLLISION_ALARM_PARAM"] = 112] = "COLLISION_ALARM_PARAM";
    ParamId[ParamId["ROLLOVER_ALARM_PARAM"] = 113] = "ROLLOVER_ALARM_PARAM";
    ParamId[ParamId["PHOTO_INTERVAL"] = 128] = "PHOTO_INTERVAL";
    ParamId[ParamId["PHOTO_DISTANCE"] = 129] = "PHOTO_DISTANCE";
    ParamId[ParamId["PHOTO_ON_ALARM"] = 130] = "PHOTO_ON_ALARM";
    ParamId[ParamId["MAX_PHOTO_SIZE"] = 131] = "MAX_PHOTO_SIZE";
    ParamId[ParamId["MULTI_CHANNEL_VIDEO"] = 144] = "MULTI_CHANNEL_VIDEO";
    ParamId[ParamId["VIDEO_TIME"] = 145] = "VIDEO_TIME";
    ParamId[ParamId["ADAS_ALARM_ENABLE"] = 160] = "ADAS_ALARM_ENABLE";
    ParamId[ParamId["DMS_ALARM_ENABLE"] = 161] = "DMS_ALARM_ENABLE";
})(ParamId || (exports.ParamId = ParamId = {}));
var VehicleControlCmd;
(function (VehicleControlCmd) {
    VehicleControlCmd[VehicleControlCmd["CUT_OIL"] = 1] = "CUT_OIL";
    VehicleControlCmd[VehicleControlCmd["RESTORE_OIL"] = 2] = "RESTORE_OIL";
    VehicleControlCmd[VehicleControlCmd["CUT_CIRCUIT"] = 4] = "CUT_CIRCUIT";
    VehicleControlCmd[VehicleControlCmd["RESTORE_CIRCUIT"] = 8] = "RESTORE_CIRCUIT";
    VehicleControlCmd[VehicleControlCmd["DOOR_LOCK"] = 16] = "DOOR_LOCK";
    VehicleControlCmd[VehicleControlCmd["DOOR_UNLOCK"] = 32] = "DOOR_UNLOCK";
})(VehicleControlCmd || (exports.VehicleControlCmd = VehicleControlCmd = {}));
class JT808Parser {
    static DELIMITER = 0x7e;
    static ESCAPE = 0x7d;
    static unescape(data) {
        const result = [];
        let i = 0;
        while (i < data.length) {
            if (data[i] === this.ESCAPE) {
                i++;
                result.push(data[i] === 0x01 ? 0x7d : 0x7e);
            }
            else {
                result.push(data[i]);
            }
            i++;
        }
        return Buffer.from(result);
    }
    static escape(data) {
        const result = [];
        for (const byte of data) {
            if (byte === 0x7e) {
                result.push(0x7d, 0x02);
            }
            else if (byte === 0x7d) {
                result.push(0x7d, 0x01);
            }
            else {
                result.push(byte);
            }
        }
        return Buffer.from(result);
    }
    static checksum(data) {
        let xor = 0;
        for (const byte of data)
            xor ^= byte;
        return xor;
    }
    static buildFrame(messageId, phone, serialNo, body, encrypt = 0) {
        const header = Buffer.alloc(12);
        header.writeUInt16BE(messageId, 0);
        header.writeUInt16BE((encrypt << 10) | (body.length & 0x3ff), 2);
        Buffer.from(phone.padStart(12, '0'), 'hex').copy(header, 4);
        header.writeUInt16BE(serialNo & 0xffff, 10);
        const frame = Buffer.concat([header, body]);
        const cs = this.checksum(frame);
        const full = Buffer.concat([frame, Buffer.from([cs])]);
        return Buffer.concat([
            Buffer.from([this.DELIMITER]),
            this.escape(full),
            Buffer.from([this.DELIMITER]),
        ]);
    }
    static parseFrame(rawData) {
        try {
            const start = rawData.indexOf(this.DELIMITER);
            const end = rawData.lastIndexOf(this.DELIMITER);
            if (start === -1 || end === -1 || start === end)
                return null;
            const inner = rawData.subarray(start + 1, end);
            const unescaped = this.unescape(inner);
            const cs = unescaped[unescaped.length - 1];
            const data = unescaped.subarray(0, -1);
            if (cs !== this.checksum(data))
                return null;
            const messageId = data.readUInt16BE(0);
            const messageAttr = data.readUInt16BE(2);
            const bodyLen = messageAttr & 0x3ff;
            const encryptionType = (messageAttr >> 10) & 0x07;
            const isMultiPacket = !!(messageAttr & 0x2000);
            const phoneNumber = data.subarray(4, 10).toString('hex').replace(/^0+/, '') || '0';
            const serialNumber = data.readUInt16BE(10);
            let headerLen = 12;
            let totalPackets;
            let packetNumber;
            if (isMultiPacket) {
                totalPackets = data.readUInt16BE(12);
                packetNumber = data.readUInt16BE(14);
                headerLen = 16;
            }
            const messageBody = data.subarray(headerLen, headerLen + bodyLen);
            return { messageId, messageBody, phoneNumber, serialNumber, encryptionType, isMultiPacket, totalPackets, packetNumber };
        }
        catch {
            return null;
        }
    }
    static buildGeneralResponse(phone, serialNo, respondSerial, respondId, result = 0) {
        const body = Buffer.alloc(5);
        body.writeUInt16BE(respondSerial, 0);
        body.writeUInt16BE(respondId, 2);
        body[4] = result;
        return this.buildFrame(MsgId.PLATFORM_GENERAL_RESPONSE, phone, serialNo, body);
    }
    static buildRegistrationResponse(phone, serialNo, respondSerial, result, authCode) {
        const authBuf = Buffer.from(authCode, 'ascii');
        const body = Buffer.alloc(3 + authBuf.length);
        body.writeUInt16BE(respondSerial, 0);
        body[2] = result;
        authBuf.copy(body, 3);
        return this.buildFrame(MsgId.TERMINAL_REGISTER_RESPONSE, phone, serialNo, body);
    }
    static buildSetParams(phone, serialNo, params) {
        const items = [];
        for (const p of params) {
            const item = Buffer.alloc(5 + p.value.length);
            item.writeUInt32BE(p.id, 0);
            item[4] = p.value.length;
            p.value.copy(item, 5);
            items.push(item);
        }
        const payload = Buffer.concat(items);
        const body = Buffer.alloc(1 + payload.length);
        body[0] = params.length;
        payload.copy(body, 1);
        return this.buildFrame(MsgId.SET_TERMINAL_PARAMS, phone, serialNo, body);
    }
    static buildQueryParams(phone, serialNo, paramIds) {
        if (!paramIds || paramIds.length === 0) {
            return this.buildFrame(MsgId.QUERY_TERMINAL_PARAMS, phone, serialNo, Buffer.alloc(0));
        }
        const body = Buffer.alloc(1 + paramIds.length * 4);
        body[0] = paramIds.length;
        paramIds.forEach((id, i) => body.writeUInt32BE(id, 1 + i * 4));
        return this.buildFrame(MsgId.QUERY_TERMINAL_PARAMS, phone, serialNo, body);
    }
    static buildTerminalControl(phone, serialNo, cmd, param = '') {
        const paramBuf = Buffer.from(param, 'ascii');
        const body = Buffer.alloc(1 + paramBuf.length);
        body[0] = cmd;
        paramBuf.copy(body, 1);
        return this.buildFrame(MsgId.TERMINAL_CONTROL, phone, serialNo, body);
    }
    static buildVehicleControl(phone, serialNo, controlFlags) {
        const body = Buffer.alloc(1);
        body[0] = controlFlags & 0xff;
        return this.buildFrame(MsgId.VEHICLE_CONTROL, phone, serialNo, body);
    }
    static buildLocationQuery(phone, serialNo) {
        return this.buildFrame(MsgId.QUERY_LOCATION, phone, serialNo, Buffer.alloc(0));
    }
    static buildTempTracking(phone, serialNo, interval, validity) {
        const body = Buffer.alloc(6);
        body.writeUInt16BE(interval, 0);
        body.writeUInt32BE(validity, 2);
        return this.buildFrame(MsgId.TEMP_LOCATION_TRACKING, phone, serialNo, body);
    }
    static buildTextMessage(phone, serialNo, flags, text) {
        const textBuf = Buffer.from(text, 'utf8');
        const body = Buffer.alloc(1 + textBuf.length);
        body[0] = flags;
        textBuf.copy(body, 1);
        return this.buildFrame(MsgId.TEXT_MESSAGE, phone, serialNo, body);
    }
    static buildCameraShoot(phone, serialNo, channel, command, interval, savingFlag, resolution, quality, brightness, contrast, saturation, chroma) {
        const body = Buffer.alloc(12);
        body[0] = channel;
        body.writeUInt16BE(command, 1);
        body.writeUInt16BE(interval, 3);
        body[5] = savingFlag;
        body[6] = resolution;
        body[7] = quality;
        body[8] = brightness;
        body[9] = contrast;
        body[10] = saturation;
        body[11] = chroma;
        return this.buildFrame(MsgId.CAMERA_SHOOT, phone, serialNo, body);
    }
    static buildMultimediaUploadResponse(phone, serialNo, mediaId, retransmitPackets) {
        const body = Buffer.alloc(4 + 2 + retransmitPackets.length * 2);
        body.writeUInt32BE(mediaId, 0);
        body.writeUInt16BE(retransmitPackets.length, 4);
        retransmitPackets.forEach((p, i) => body.writeUInt16BE(p, 6 + i * 2));
        return this.buildFrame(MsgId.MULTIMEDIA_UPLOAD_RESPONSE, phone, serialNo, body);
    }
    static buildRealtimeVideoRequest(phone, serialNo, serverIp, serverTcpPort, serverUdpPort, channel, dataType, streamType) {
        // JT1078-2016 Table 17: ipLen(1) + ip(n) + tcpPort(2) + udpPort(2) + channel(1) + dataType(1) + streamType(1)
        const ipBytes = Buffer.from(serverIp, 'ascii');
        const n = ipBytes.length;
        const body = Buffer.alloc(1 + n + 7);
        body[0] = n;
        ipBytes.copy(body, 1);
        body.writeUInt16BE(serverTcpPort, 1 + n);
        body.writeUInt16BE(serverUdpPort, 3 + n);
        body[5 + n] = channel;
        body[6 + n] = dataType;
        body[7 + n] = streamType;
        return this.buildFrame(MsgId.REALTIME_VIDEO_REQUEST, phone, serialNo, body);
    }
    static buildVideoControl(phone, serialNo, channel, command, closeType) {
        const body = Buffer.alloc(closeType !== undefined ? 3 : 2);
        body[0] = channel;
        body[1] = command;
        if (closeType !== undefined)
            body[2] = closeType;
        return this.buildFrame(MsgId.REALTIME_VIDEO_CONTROL, phone, serialNo, body);
    }
    static buildHistVideoRequest(phone, serialNo, channel, mediaType, streamType, storageType, playbackMode, playbackSpeed, startTime, endTime, serverIp, serverTcpPort, serverUdpPort) {
        const ipBuf = Buffer.alloc(41);
        Buffer.from(serverIp).copy(ipBuf);
        const body = Buffer.alloc(64);
        body[0] = channel;
        body[1] = mediaType;
        body[2] = streamType;
        body[3] = storageType;
        body[4] = playbackMode;
        body[5] = playbackSpeed;
        this.encodeBcdTime(startTime).copy(body, 6);
        this.encodeBcdTime(endTime).copy(body, 12);
        ipBuf.copy(body, 18);
        body.writeUInt16BE(serverTcpPort, 59);
        body.writeUInt16BE(serverUdpPort, 61);
        return this.buildFrame(MsgId.HIST_VIDEO_PLAYBACK_REQ, phone, serialNo, body);
    }
    static buildFileListQuery(phone, serialNo, channel, startTime, endTime, alarmFlag, mediaType, storageType) {
        const body = Buffer.alloc(21);
        body[0] = channel;
        this.encodeBcdTime(startTime).copy(body, 1);
        this.encodeBcdTime(endTime).copy(body, 7);
        body.writeUInt32BE(alarmFlag, 13);
        body[17] = mediaType;
        body[18] = storageType;
        body[19] = 0;
        body[20] = 20;
        return this.buildFrame(MsgId.FILE_LIST_QUERY, phone, serialNo, body);
    }
    static buildFileUploadControl(phone, serialNo, serverIp, serverTcpPort, channel, startTime, endTime, alarmFlag, mediaType, storageType, taskId, condition) {
        const ipBuf = Buffer.alloc(41);
        Buffer.from(serverIp).copy(ipBuf);
        const body = Buffer.alloc(70);
        ipBuf.copy(body, 0);
        body.writeUInt16BE(serverTcpPort, 41);
        body[43] = channel;
        this.encodeBcdTime(startTime).copy(body, 44);
        this.encodeBcdTime(endTime).copy(body, 50);
        body.writeUInt32BE(alarmFlag, 56);
        body[60] = mediaType;
        body[61] = storageType;
        body[62] = taskId;
        body[63] = condition;
        return this.buildFrame(MsgId.FILE_UPLOAD_CONTROL, phone, serialNo, body);
    }
    static buildPushVehicleAlarm(phone, serialNo, msgSerial, alarmTime, alarmSrc, alarmType, alarmLevel, description, operatorId) {
        const descBuf = Buffer.from(description, 'utf8');
        const opBuf = Buffer.from(operatorId, 'ascii');
        const body = Buffer.alloc(14 + 1 + descBuf.length + 1 + opBuf.length);
        body.writeUInt32BE(msgSerial, 0);
        this.encodeBcdTime(alarmTime).copy(body, 4);
        body[10] = alarmSrc;
        body.writeUInt16BE(alarmType, 11);
        body[13] = alarmLevel;
        body[14] = descBuf.length;
        descBuf.copy(body, 15);
        body[15 + descBuf.length] = opBuf.length;
        opBuf.copy(body, 16 + descBuf.length);
        return this.buildFrame(MsgId.PUSH_VEHICLE_ALARM, phone, serialNo, body);
    }
    static buildPtzControl(phone, serialNo, channel, speed, cmd) {
        const body = Buffer.alloc(3);
        body[0] = channel;
        body[1] = speed;
        body[2] = cmd;
        return this.buildFrame(MsgId.PTZ_CONTROL, phone, serialNo, body);
    }
    static parseLocation(body) {
        if (body.length < 28)
            throw new Error('Location body too short');
        const alarmWord = body.readUInt32BE(0);
        const statusWord = body.readUInt32BE(4);
        const latRaw = body.readUInt32BE(8) / 1_000_000;
        const lngRaw = body.readUInt32BE(12) / 1_000_000;
        const altitude = body.readUInt16BE(16);
        const speed = body.readUInt16BE(18) / 10;
        const heading = body.readUInt16BE(20);
        const bcd = (b) => Math.floor(b / 16) * 10 + (b & 0x0f);
        const yr = bcd(body[22]), mo = bcd(body[23]), dy = bcd(body[24]);
        const hh = bcd(body[25]), mm = bcd(body[26]), ss = bcd(body[27]);
        const timestamp = new Date(2000 + yr, mo - 1, dy, hh, mm, ss);
        const statusFlags = {
            accOn: !!(statusWord & 0x00000001),
            located: !!(statusWord & 0x00000002),
            latitude: (statusWord & 0x00000004) ? 'south' : 'north',
            longitude: (statusWord & 0x00000008) ? 'west' : 'east',
            inOperation: !!(statusWord & 0x00000010),
            encrypted: !!(statusWord & 0x00000020),
            loadBit: (statusWord >> 6) & 0x03,
            oilRouteOn: !!(statusWord & 0x00000400),
            circuitOn: !!(statusWord & 0x00000800),
            doorLocked: !!(statusWord & 0x00001000),
            door1Open: !!(statusWord & 0x00002000),
            door2Open: !!(statusWord & 0x00004000),
            door3Open: !!(statusWord & 0x00008000),
            door4Open: !!(statusWord & 0x00010000),
            door5Open: !!(statusWord & 0x00020000),
            gpsUsed: !!(statusWord & 0x00040000),
            bdsUsed: !!(statusWord & 0x00080000),
            glonassUsed: !!(statusWord & 0x00100000),
            galileoUsed: !!(statusWord & 0x00200000),
        };
        const alarmFlags = {
            sos: !!(alarmWord & 0x00000001),
            overSpeed: !!(alarmWord & 0x00000002),
            fatigue: !!(alarmWord & 0x00000004),
            danger: !!(alarmWord & 0x00000008),
            gnssFault: !!(alarmWord & 0x00000010),
            gnssAntennaDisconnect: !!(alarmWord & 0x00000020),
            gnssAntennaShorting: !!(alarmWord & 0x00000040),
            lowPower: !!(alarmWord & 0x00000080),
            powerCut: !!(alarmWord & 0x00000100),
            vehicleTheft: !!(alarmWord & 0x00000200),
            illegalIgnition: !!(alarmWord & 0x00000400),
            illegalDisplacement: !!(alarmWord & 0x00000800),
            collision: !!(alarmWord & 0x00001000),
            rollover: !!(alarmWord & 0x00002000),
            illegalDoorOpen: !!(alarmWord & 0x00004000),
            vssFault: !!(alarmWord & 0x00008000),
            dayOverSpeed: !!(alarmWord & 0x00010000),
            nightOverSpeed: !!(alarmWord & 0x00020000),
            routeDeviation: !!(alarmWord & 0x00040000),
            routeSectionTimeLow: !!(alarmWord & 0x00080000),
            routeSectionTimeHigh: !!(alarmWord & 0x00100000),
            routeTransportTimeout: !!(alarmWord & 0x00200000),
            vehicleFuelAbnormal: !!(alarmWord & 0x00400000),
            vehicleRadioFault: !!(alarmWord & 0x00800000),
            adasFCW: !!(alarmWord & 0x01000000),
            adasLDW: !!(alarmWord & 0x02000000),
            adasPCW: !!(alarmWord & 0x04000000),
            adasBSM: !!(alarmWord & 0x08000000),
            dmsFatigue: !!(alarmWord & 0x10000000),
            dmsDistraction: !!(alarmWord & 0x20000000),
            dmsPhone: !!(alarmWord & 0x40000000),
            dmsSmoking: !!(alarmWord & 0x80000000),
        };
        const loc = {
            latitude: statusFlags.latitude === 'south' ? -latRaw : latRaw,
            longitude: statusFlags.longitude === 'west' ? -lngRaw : lngRaw,
            altitude, speed, heading, timestamp,
            alarmFlags, statusFlags,
            engineOn: statusFlags.accOn || false,
            gpsValid: statusFlags.located || false,
        };
        let offset = 28;
        while (offset + 2 <= body.length) {
            const infoId = body[offset];
            const infoLen = body[offset + 1];
            if (offset + 2 + infoLen > body.length)
                break;
            const d = body.subarray(offset + 2, offset + 2 + infoLen);
            offset += 2 + infoLen;
            switch (infoId) {
                case 0x01:
                    loc.mileage = d.readUInt32BE(0) / 10;
                    break;
                case 0x02:
                    loc.fuelLevel = d.readUInt16BE(0) / 10;
                    break;
                case 0x03:
                    loc.speedFromOBD = d.readUInt16BE(0) / 10;
                    break;
                case 0x04:
                    loc.engineRpm = d.readUInt16BE(0);
                    break;
                case 0x05:
                    loc.engineWaterTemp = d[0];
                    break;
                case 0x06:
                    loc.fuelConsumption = d.readUInt16BE(0) / 10;
                    break;
                case 0x07:
                    loc.recordSpeed = d.readUInt16BE(0);
                    break;
                case 0x08:
                    loc.alarmEventId = d.readUInt32BE(0);
                    break;
                case 0x09:
                    loc.tiresInfo = d;
                    break;
                case 0x0A:
                    loc.overdraftAlarm = d[0];
                    break;
                case 0x25: break;
                case 0x30:
                    loc.satellites = d[0];
                    break;
                case 0x31:
                    loc.signalStrength = d[0];
                    break;
                case 0x32:
                    loc.gnssPositionCount = d.readUInt16BE(0);
                    break;
                case 0x33:
                    loc.gnssSpeed = d.readUInt16BE(0) / 10;
                    break;
                case 0x64:
                    if (d.length >= 7) {
                        loc.adasAlert = {
                            alarmId: d.readUInt32BE(0),
                            flagState: d[4],
                            alarmType: d[5],
                            speed: d.length > 6 ? d[6] : undefined,
                            cameraChannels: d.length > 7 ? d[7] : undefined,
                            videoDuration: d.length > 8 ? d[8] : undefined,
                            picCount: d.length > 9 ? d[9] : undefined,
                        };
                        if (loc.adasAlert.alarmType === 0)
                            alarmFlags.adasFCW = true;
                        if (loc.adasAlert.alarmType === 1)
                            alarmFlags.adasLDW = true;
                        if (loc.adasAlert.alarmType === 3)
                            alarmFlags.adasPCW = true;
                        if (loc.adasAlert.alarmType === 4)
                            alarmFlags.adasBSM = true;
                    }
                    break;
                case 0x65:
                    if (d.length >= 7) {
                        loc.dmsAlert = {
                            alarmId: d.readUInt32BE(0),
                            flagState: d[4],
                            alarmType: d[5],
                            speed: d.length > 6 ? d[6] : undefined,
                            cameraChannels: d.length > 7 ? d[7] : undefined,
                            videoDuration: d.length > 8 ? d[8] : undefined,
                            picCount: d.length > 9 ? d[9] : undefined,
                        };
                        if (loc.dmsAlert.alarmType === 0)
                            alarmFlags.dmsFatigue = true;
                        if (loc.dmsAlert.alarmType === 1)
                            alarmFlags.dmsDistraction = true;
                        if (loc.dmsAlert.alarmType === 2)
                            alarmFlags.dmsPhone = true;
                        if (loc.dmsAlert.alarmType === 3)
                            alarmFlags.dmsSmoking = true;
                    }
                    break;
                default: break;
            }
        }
        return loc;
    }
    static parseRegistration(body) {
        const provinceId = body.readUInt16BE(0);
        const cityId = body.readUInt16BE(2);
        const manufacturerId = body.subarray(4, 9).toString('ascii').replace(/\0/g, '').trim();
        const terminalModel = body.subarray(9, 29).toString('ascii').replace(/\0/g, '').trim();
        const terminalId = body.subarray(29, 36).toString('ascii').replace(/\0/g, '').trim();
        const plateColor = body[36];
        const plateNumber = body.subarray(37).toString('utf8').replace(/\0/g, '').trim();
        return { provinceId, cityId, manufacturerId, terminalModel, terminalId, plateColor, plateNumber };
    }
    static parseTerminalProperties(body) {
        const terminalType = body.readUInt16BE(0);
        const manufacturer = body.subarray(2, 7).toString('ascii').trim();
        const terminalModel = body.subarray(7, 27).toString('ascii').replace(/\0/g, '').trim();
        const terminalId = body.subarray(27, 34).toString('ascii').replace(/\0/g, '').trim();
        const simIccid = body.subarray(34, 44).toString('ascii').trim();
        const hwVerLen = body[44];
        const hwVersion = body.subarray(45, 45 + hwVerLen).toString('ascii');
        const fwVerLen = body[45 + hwVerLen];
        const fwVersion = body.subarray(46 + hwVerLen, 46 + hwVerLen + fwVerLen).toString('ascii');
        let off = 46 + hwVerLen + fwVerLen;
        const gnssModuleAttr = body.readUInt32BE(off);
        const commModuleAttr = body.readUInt32BE(off + 4);
        return { terminalType, manufacturer, terminalModel, terminalId, simIccid, hwVersion, fwVersion, gnssModuleAttr, commModuleAttr };
    }
    static parseTerminalParamsResponse(body) {
        const respondSerial = body.readUInt16BE(0);
        const count = body[2];
        const params = [];
        let offset = 3;
        for (let i = 0; i < count && offset + 5 <= body.length; i++) {
            const id = body.readUInt32BE(offset);
            const len = body[offset + 4];
            const value = body.subarray(offset + 5, offset + 5 + len);
            params.push({ id, value });
            offset += 5 + len;
        }
        return { respondSerial, params };
    }
    static parseMultimediaEvent(body) {
        const mediaId = body.readUInt32BE(0);
        const mediaType = body[4];
        const channel = body[5];
        const event = body[6];
        let location = null;
        if (body.length > 7) {
            try {
                location = this.parseLocation(body.subarray(7));
            }
            catch { }
        }
        return { mediaId, mediaType, channel, event, location };
    }
    static parseMultimediaData(body) {
        const mediaId = body.readUInt32BE(0);
        const mediaType = body[4];
        const mediaFormat = body[5];
        const event = body[6];
        const channel = body[7];
        let location = null;
        const locEnd = 8 + 28;
        if (body.length > locEnd) {
            try {
                location = this.parseLocation(body.subarray(8, locEnd));
            }
            catch { }
        }
        const data = body.subarray(locEnd < body.length ? locEnd : 8);
        return { mediaId, mediaType, mediaFormat, event, channel, location, data, isComplete: true };
    }
    static parseVehicleControlResponse(body) {
        const serialNumber = body.readUInt16BE(0);
        let location = null;
        if (body.length > 2) {
            try {
                location = this.parseLocation(body.subarray(2));
            }
            catch { }
        }
        return { serialNumber, location };
    }
    static parseDriverIdentity(body) {
        const status = body[0];
        const time = this.decodeBcdTime(body.subarray(1, 7));
        const icResult = body[7];
        const nameLen = body[8];
        const name = body.subarray(9, 9 + nameLen).toString('utf8');
        let offset = 9 + nameLen;
        const certCode = body.subarray(offset, offset + 20).toString('ascii').trim();
        offset += 20;
        const orgLen = body[offset];
        const orgName = body.subarray(offset + 1, offset + 1 + orgLen).toString('utf8');
        offset += 1 + orgLen;
        const certExpiry = this.decodeBcdTime(body.subarray(offset, offset + 4));
        return { status, time, icResult, name, certCode, orgName, certExpiry };
    }
    static encodeBcdTime(d) {
        const buf = Buffer.alloc(6);
        buf[0] = d.getFullYear() - 2000;
        buf[1] = d.getMonth() + 1;
        buf[2] = d.getDate();
        buf[3] = d.getHours();
        buf[4] = d.getMinutes();
        buf[5] = d.getSeconds();
        return buf;
    }
    static decodeBcdTime(buf) {
        return new Date(2000 + buf[0], buf[1] - 1, buf[2], buf[3] || 0, buf[4] || 0, buf[5] || 0);
    }
    static adasAlarmTypeName(t) {
        return ['FCW', 'LDW', 'HMWW', 'PCW', 'BSM', 'TSR', 'RoadSign', 'NoLane'][t] ?? `ADAS_${t}`;
    }
    static dmsAlarmTypeName(t) {
        return ['Fatigue', 'Distraction', 'Phone', 'Smoking', 'NoDriver', 'Infrared'][t] ?? `DMS_${t}`;
    }
}
exports.JT808Parser = JT808Parser;
//# sourceMappingURL=jt808.parser.js.map