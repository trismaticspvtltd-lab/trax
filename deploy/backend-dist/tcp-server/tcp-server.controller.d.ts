import { TcpServerService } from './tcp-server.service';
export declare class TcpServerController {
    private tcpServerService;
    constructor(tcpServerService: TcpServerService);
    getConnectedDevices(): {
        phone: string;
        authenticated: boolean;
        lastHeartbeat: Date;
    }[];
    vehicleControl(imei: string, body: {
        flags: number;
    }): {
        sent: boolean;
        flags: number;
        flagNames: string[];
    };
    queryLocation(imei: string): {
        sent: boolean;
        note: string;
    };
    tempTracking(imei: string, body: {
        interval: number;
        validity: number;
    }): {
        sent: boolean;
    };
    setParams(imei: string, body: {
        params: Array<{
            id: number;
            type: string;
            value: any;
        }>;
    }): {
        sent: boolean;
    };
    queryParams(imei: string, body: {
        paramIds?: number[];
    }): {
        sent: boolean;
        note: string;
    };
    sendText(imei: string, body: {
        text: string;
        flags?: number;
    }): {
        sent: boolean;
    };
    terminalControl(imei: string, body: {
        cmd: number;
        param?: string;
    }): {
        sent: boolean;
    };
    takePhoto(imei: string, body: {
        channel?: number;
        command?: number;
        interval?: number;
        savingFlag?: number;
        resolution?: number;
        quality?: number;
    }): {
        sent: boolean;
    };
    requestVideo(imei: string, body: {
        serverIp: string;
        serverTcpPort: number;
        serverUdpPort?: number;
        channel?: number;
        dataType?: number;
        streamType?: number;
    }): {
        sent: boolean;
    };
    videoControl(imei: string, body: {
        channel: number;
        command: number;
        closeType?: number;
    }): {
        sent: boolean;
    };
    histVideoRequest(imei: string, body: {
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
    }): {
        sent: boolean;
    };
    queryFiles(imei: string, body: {
        channel?: number;
        startTime: string;
        endTime: string;
        alarmFlag?: number;
        mediaType?: number;
        storageType?: number;
    }): {
        sent: boolean;
        note: string;
    };
    fileUploadControl(imei: string, body: {
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
    }): {
        sent: boolean;
    };
    ptzControl(imei: string, body: {
        channel?: number;
        speed?: number;
        cmd: number;
    }): {
        sent: boolean;
    };
}
