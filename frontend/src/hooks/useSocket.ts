import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { LiveUpdate } from '../types';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState<Map<number, LiveUpdate>>(new Map());
  const [newAlert, setNewAlert] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    socketRef.current = io(`${SOCKET_URL}/tracking`, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
      socketRef.current?.emit('subscribe_all');
    });

    socketRef.current.on('disconnect', () => setConnected(false));

    socketRef.current.on('location_update', (data: LiveUpdate) => {
      setLiveUpdates((prev) => {
        const next = new Map(prev);
        next.set(data.deviceId, data);
        return next;
      });
    });

    socketRef.current.on('new_alert', (alert: any) => {
      setNewAlert(alert);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const subscribeDevice = (deviceId: number) => {
    socketRef.current?.emit('subscribe_device', deviceId.toString());
  };

  const unsubscribeDevice = (deviceId: number) => {
    socketRef.current?.emit('unsubscribe_device', deviceId.toString());
  };

  return { connected, liveUpdates, newAlert, subscribeDevice, unsubscribeDevice };
}
