"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const net = __importStar(require("net"));
const IMEI = '861234567890001';
const PHONE = '086123456789000';
function checksum(data) {
    let xor = 0;
    for (const b of data)
        xor ^= b;
    return xor;
}
function escape(data) {
    const r = [];
    for (const b of data) {
        if (b === 0x7e)
            r.push(0x7d, 0x02);
        else if (b === 0x7d)
            r.push(0x7d, 0x01);
        else
            r.push(b);
    }
    return Buffer.from(r);
}
function buildFrame(msgId, phone, serial, body) {
    const header = Buffer.alloc(12);
    header.writeUInt16BE(msgId, 0);
    header.writeUInt16BE(body.length & 0x1ff, 2);
    Buffer.from(phone.padStart(12, '0'), 'hex').copy(header, 4);
    header.writeUInt16BE(serial, 10);
    const frame = Buffer.concat([header, body]);
    const cs = checksum(frame);
    const full = Buffer.concat([frame, Buffer.from([cs])]);
    return Buffer.concat([Buffer.from([0x7e]), escape(full), Buffer.from([0x7e])]);
}
function buildLocation(lat, lng, speed, heading) {
    const body = Buffer.alloc(28);
    body.writeUInt32BE(0, 0);
    body.writeUInt32BE(0x02, 4);
    body.writeUInt32BE(Math.round(Math.abs(lat) * 1000000), 8);
    body.writeUInt32BE(Math.round(Math.abs(lng) * 1000000), 12);
    body.writeUInt16BE(50, 16);
    body.writeUInt16BE(Math.round(speed * 10), 18);
    body.writeUInt16BE(heading, 20);
    const now = new Date();
    body[22] = now.getFullYear() - 2000;
    body[23] = now.getMonth() + 1;
    body[24] = now.getDate();
    body[25] = now.getHours();
    body[26] = now.getMinutes();
    body[27] = now.getSeconds();
    return body;
}
function buildRegistration() {
    const body = Buffer.alloc(37 + 6);
    body.writeUInt16BE(3301, 0);
    body.writeUInt16BE(0, 2);
    Buffer.from('T9801', 'ascii').copy(body, 4);
    Buffer.from('T98DASHCAM       ', 'ascii').copy(body, 9);
    Buffer.from('DEV001 ', 'ascii').copy(body, 29);
    body[36] = 1;
    Buffer.from('MH01A2B3', 'ascii').copy(body, 37);
    return body;
}
class DeviceSimulator {
    socket;
    serial = 0;
    lat = 19.076090;
    lng = 72.877426;
    speed = 0;
    heading = 90;
    connected = false;
    connect(host, port) {
        this.socket = new net.Socket();
        this.socket.connect(port, host, () => {
            this.connected = true;
            console.log(`Connected to ${host}:${port}`);
            this.sendRegistration();
            setTimeout(() => this.startLocationUpdates(), 2000);
            setInterval(() => this.sendHeartbeat(), 30000);
        });
        this.socket.on('data', (data) => {
            console.log(`Server: ${data.toString('hex')}`);
        });
        this.socket.on('error', (err) => {
            console.error('Socket error:', err.message);
            setTimeout(() => this.connect(host, port), 5000);
        });
        this.socket.on('close', () => {
            this.connected = false;
            console.log('Connection closed, reconnecting...');
            setTimeout(() => this.connect(host, port), 3000);
        });
    }
    sendRegistration() {
        const body = buildRegistration();
        const frame = buildFrame(0x0100, PHONE, ++this.serial, body);
        this.socket.write(frame);
        console.log('Sent registration');
    }
    sendHeartbeat() {
        if (!this.connected)
            return;
        const frame = buildFrame(0x0002, PHONE, ++this.serial, Buffer.alloc(0));
        this.socket.write(frame);
        console.log('Heartbeat sent');
    }
    startLocationUpdates() {
        setInterval(() => {
            if (!this.connected)
                return;
            this.lat += (Math.random() - 0.5) * 0.001;
            this.lng += (Math.random() - 0.5) * 0.001;
            this.speed = 30 + Math.random() * 40;
            this.heading = (this.heading + Math.floor(Math.random() * 10 - 5) + 360) % 360;
            const body = buildLocation(this.lat, this.lng, this.speed, this.heading);
            const frame = buildFrame(0x0200, PHONE, ++this.serial, body);
            this.socket.write(frame);
            console.log(`Location: ${this.lat.toFixed(6)}, ${this.lng.toFixed(6)} @ ${Math.round(this.speed)} km/h`);
        }, 5000);
    }
}
const host = process.env.NGROK_HOST || 'localhost';
const port = parseInt(process.env.NGROK_PORT || process.env.TCP_PORT || '8808');
console.log(`Traxlogi Device Simulator - IMEI: ${IMEI}`);
console.log(`Connecting to ${host}:${port}...`);
new DeviceSimulator().connect(host, port);
//# sourceMappingURL=device-simulator.js.map