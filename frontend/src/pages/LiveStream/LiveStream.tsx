import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
// @ts-ignore
import JMuxer from 'jmuxer';
import { deviceCommandsApi } from '../../api';
import './LiveStream.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StreamDevice {
  imei: string;
  phone?: string;
  channel: number;
  status: 'connecting' | 'live' | 'stopped' | 'recording';
  startTime: string;
  recordingId?: string;
}

interface StreamStatusPayload {
  imei: string;
  channel?: number;
  status: 'live' | 'stopped' | 'connecting' | 'recording';
  phone?: string;
  startTime?: string;
}

interface StreamEventPayload {
  event: 'started' | 'stopped' | 'live' | 'recording_complete';
  imei?: string;
  channel?: number;
  data?: {
    recordingId?: string;
    [key: string]: any;
  };
}

interface FramePayload {
  video: ArrayBuffer | Uint8Array;
  keyFrame: boolean;
  ts: number;
}

interface ActiveStream {
  imei: string;
  channel: number;
  status: 'connecting' | 'live' | 'stopped';
  jmuxer: any | null;
  recordingId?: string;
  ended: boolean;
}

type StreamKey = string; // `${imei}_${channel}`

function streamKey(imei: string, channel: number): StreamKey {
  return `${imei}_${channel}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: StreamDevice['status'] | 'connecting' | 'live' | 'stopped';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<string, { label: string; className: string }> = {
    live:       { label: 'LIVE',       className: 'badge-live' },
    connecting: { label: 'CONNECTING', className: 'badge-connecting' },
    stopped:    { label: 'STOPPED',    className: 'badge-stopped' },
    recording:  { label: 'REC',        className: 'badge-recording' },
  };
  const entry = map[status] ?? { label: status.toUpperCase(), className: 'badge-stopped' };
  return <span className={`stream-badge ${entry.className}`}>{entry.label}</span>;
}

interface VideoPlayerProps {
  imei: string;
  channel: number;
  status: 'connecting' | 'live' | 'stopped';
  recordingId?: string;
  ended: boolean;
  onSnapshot: () => void;
  socketRef: React.MutableRefObject<Socket | null>;
}

function VideoPlayer({ imei, channel, status, recordingId, ended, onSnapshot, socketRef }: VideoPlayerProps) {
  const videoId = `video-player-${imei}-${channel}`;
  const jmuxerRef = useRef<any>(null);
  const mountedRef = useRef(false);

  // Initialise JMuxer after video element mounts
  useEffect(() => {
    mountedRef.current = true;

    // Small delay to guarantee the DOM element is present
    const timer = setTimeout(() => {
      if (!mountedRef.current) return;
      const el = document.getElementById(videoId);
      if (!el) return;

      try {
        jmuxerRef.current = new JMuxer({
          node: videoId,
          mode: 'video',
          debug: false,
          fps: 25,
          flushingTime: 0,
        });
      } catch (err) {
        console.error('[JMuxer] init error', err);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      mountedRef.current = false;
      if (jmuxerRef.current) {
        try { jmuxerRef.current.destroy(); } catch (_) {}
        jmuxerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Feed incoming frames into JMuxer
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const key = streamKey(imei, channel);
    const handler = (payload: FramePayload & { imei: string; channel: number }) => {
      if (payload.imei !== imei || payload.channel !== channel) return;
      if (!jmuxerRef.current) return;
      try {
        const bytes =
          payload.video instanceof Uint8Array
            ? payload.video
            : new Uint8Array(payload.video as ArrayBuffer);
        jmuxerRef.current.feed({ video: bytes });
      } catch (err) {
        console.error('[JMuxer] feed error', err);
      }
    };

    socket.on('frame', handler);
    return () => { socket.off('frame', handler); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imei, channel]);

  return (
    <div className="video-wrapper">
      {/* Player header */}
      <div className="video-header">
        <span className="video-title">
          {imei} &mdash; CH {channel}
        </span>
        <div className="video-header-actions">
          {recordingId && (
            <span className="rec-indicator">
              <span className="rec-dot" />
              REC
            </span>
          )}
          <StatusBadge status={status} />
          <button className="snapshot-btn" onClick={onSnapshot} title="Snapshot">
            &#9635;
          </button>
        </div>
      </div>

      {/* Video element — JMuxer attaches by ID */}
      <div className="video-ratio-box">
        <video
          id={videoId}
          className="video-el"
          autoPlay
          muted
          playsInline
        />

        {/* Overlays */}
        {status === 'connecting' && !ended && (
          <div className="video-overlay">
            <div className="spinner" />
            <span>Connecting…</span>
          </div>
        )}
        {ended && (
          <div className="video-overlay video-overlay-ended">
            <span className="overlay-icon">&#9632;</span>
            <span>Stream ended</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LiveStream() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState<StreamDevice[]>([]);
  const [activeStreams, setActiveStreams] = useState<Map<StreamKey, ActiveStream>>(new Map());
  const [selectedKeys, setSelectedKeys] = useState<StreamKey[]>([]);
  const [reqImei, setReqImei] = useState('');
  const [reqChannel, setReqChannel] = useState(1);
  const [reqLoading, setReqLoading] = useState(false);

  // ── Socket lifecycle ──────────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(`${SOCKET_URL}/media`, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Global status broadcast — builds the left-panel device list
    socket.on('stream_status', (payload: StreamStatusPayload) => {
      setDevices((prev) => {
        const exists = prev.findIndex(
          (d) => d.imei === payload.imei && d.channel === (payload.channel ?? 1),
        );
        const updated: StreamDevice = {
          imei: payload.imei,
          phone: payload.phone,
          channel: payload.channel ?? 1,
          status: payload.status as StreamDevice['status'],
          startTime: payload.startTime ?? new Date().toISOString(),
        };
        if (exists >= 0) {
          const next = [...prev];
          next[exists] = updated;
          return next;
        }
        return [...prev, updated];
      });

      // Update active stream status if we're watching it
      const key = streamKey(payload.imei, payload.channel ?? 1);
      setActiveStreams((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Map(prev);
        const s = next.get(key)!;
        next.set(key, {
          ...s,
          status: payload.status as ActiveStream['status'],
          ended: payload.status === 'stopped',
        });
        return next;
      });
    });

    // Per-stream events
    socket.on('stream_event', (payload: StreamEventPayload) => {
      const imei = payload.imei;
      const ch = payload.channel ?? 1;
      if (!imei) return;

      const key = streamKey(imei, ch);

      if (payload.event === 'live' || payload.event === 'started') {
        setActiveStreams((prev) => {
          if (!prev.has(key)) return prev;
          const next = new Map(prev);
          next.set(key, { ...next.get(key)!, status: 'live', ended: false });
          return next;
        });
        setDevices((prev) =>
          prev.map((d) =>
            d.imei === imei && d.channel === ch ? { ...d, status: 'live' } : d,
          ),
        );
      }

      if (payload.event === 'stopped') {
        setActiveStreams((prev) => {
          if (!prev.has(key)) return prev;
          const next = new Map(prev);
          next.set(key, { ...next.get(key)!, status: 'stopped', ended: true });
          return next;
        });
        setDevices((prev) =>
          prev.map((d) =>
            d.imei === imei && d.channel === ch ? { ...d, status: 'stopped' } : d,
          ),
        );
      }

      if (payload.event === 'recording_complete') {
        const recordingId = payload.data?.recordingId;
        setActiveStreams((prev) => {
          if (!prev.has(key)) return prev;
          const next = new Map(prev);
          next.set(key, { ...next.get(key)!, recordingId });
          return next;
        });
        setDevices((prev) =>
          prev.map((d) =>
            d.imei === imei && d.channel === ch
              ? { ...d, status: 'recording', recordingId }
              : d,
          ),
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ── Request stream from device ────────────────────────────────────────────

  const handleRequestStream = useCallback(async () => {
    const imei = reqImei.trim();
    if (!imei) return;
    setReqLoading(true);
    try {
      await deviceCommandsApi.requestVideo(imei, {
        channel: reqChannel,
        resolution: 0,
        frameRate: 25,
        keyFrameInterval: 50,
      });
      toast.success(`Stream request sent to ${imei} CH${reqChannel}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to request stream — device may be offline');
    } finally {
      setReqLoading(false);
    }
  }, [reqImei, reqChannel]);

  // ── Subscribe to a stream ─────────────────────────────────────────────────

  const subscribeStream = useCallback(
    (imei: string, channel: number) => {
      const key = streamKey(imei, channel);
      if (selectedKeys.includes(key)) return; // already shown

      // Max 4 simultaneous players
      if (selectedKeys.length >= 4) {
        toast.warn('Maximum 4 streams supported simultaneously.');
        return;
      }

      socketRef.current?.emit('subscribe_stream', { imei, channel });

      setActiveStreams((prev) => {
        const next = new Map(prev);
        next.set(key, {
          imei,
          channel,
          status: 'connecting',
          jmuxer: null,
          ended: false,
        });
        return next;
      });

      setSelectedKeys((prev) => [...prev, key]);
    },
    [selectedKeys],
  );

  // ── Remove a stream from the grid ─────────────────────────────────────────

  const removeStream = useCallback((key: StreamKey) => {
    setSelectedKeys((prev) => prev.filter((k) => k !== key));
    setActiveStreams((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  // ── Snapshot handler ──────────────────────────────────────────────────────

  const handleSnapshot = useCallback((imei: string, channel: number) => {
    toast.success(`Snapshot saved — ${imei} CH ${channel}`);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const liveCount = devices.filter((d) => d.status === 'live' || d.status === 'recording').length;

  const gridStreams = selectedKeys
    .map((k) => activeStreams.get(k))
    .filter(Boolean) as ActiveStream[];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="ls-root">
      {/* Top bar */}
      <div className="ls-topbar">
        <div className="ls-topbar-left">
          <h1 className="ls-title">Live Video Streams</h1>
          <div className="ls-status-bar">
            <span
              className="ls-conn-dot"
              style={{ background: connected ? '#22c55e' : '#ef4444' }}
            />
            <span className="ls-conn-label">{connected ? 'Connected' : 'Disconnected'}</span>
            <span className="ls-stream-count">
              {liveCount} active stream{liveCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="ls-body">
        {/* Left panel — device list */}
        <aside className="ls-panel">
          <div className="ls-panel-header">Devices</div>

          <div className="ls-request-form">
            <div className="ls-req-label">Request Stream</div>
            <input
              type="text"
              className="ls-req-input"
              placeholder="Device IMEI"
              value={reqImei}
              onChange={(e) => setReqImei(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRequestStream(); }}
            />
            <div className="ls-req-row">
              <select
                className="ls-req-select"
                value={reqChannel}
                onChange={(e) => setReqChannel(Number(e.target.value))}
              >
                <option value={1}>CH 1</option>
                <option value={2}>CH 2</option>
                <option value={3}>CH 3</option>
                <option value={4}>CH 4</option>
              </select>
              <button
                className="ls-req-btn"
                onClick={handleRequestStream}
                disabled={!reqImei.trim() || reqLoading}
              >
                {reqLoading ? '…' : 'Start'}
              </button>
            </div>
          </div>

          {devices.length === 0 ? (
            <div className="ls-panel-empty">
              Waiting for stream status&hellip;
            </div>
          ) : (
            <div className="ls-device-list">
              {devices.map((d) => {
                const key = streamKey(d.imei, d.channel);
                const isSelected = selectedKeys.includes(key);
                return (
                  <div
                    key={key}
                    className={`ls-device-item ${isSelected ? 'ls-device-selected' : ''}`}
                    onClick={() => subscribeStream(d.imei, d.channel)}
                  >
                    <div className="ls-device-top">
                      <span className="ls-device-imei">{d.imei}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    {d.phone && (
                      <span className="ls-device-phone">{d.phone}</span>
                    )}
                    <div className="ls-device-meta">
                      <span>CH {d.channel}</span>
                      <span>
                        {new Date(d.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Main video grid */}
        <main className="ls-main">
          {gridStreams.length === 0 ? (
            <div className="ls-placeholder">
              <div className="ls-placeholder-icon">&#9654;</div>
              <p>Select a device from the left panel to start watching.</p>
            </div>
          ) : (
            <div
              className="ls-grid"
              data-count={gridStreams.length}
            >
              {gridStreams.map((stream) => {
                const key = streamKey(stream.imei, stream.channel);
                return (
                  <div key={key} className="ls-grid-cell">
                    <button
                      className="ls-close-stream"
                      onClick={() => removeStream(key)}
                      title="Close stream"
                    >
                      &times;
                    </button>
                    <VideoPlayer
                      imei={stream.imei}
                      channel={stream.channel}
                      status={stream.status}
                      recordingId={stream.recordingId}
                      ended={stream.ended}
                      onSnapshot={() => handleSnapshot(stream.imei, stream.channel)}
                      socketRef={socketRef}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
