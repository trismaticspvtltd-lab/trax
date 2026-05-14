import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
// @ts-ignore
import JMuxer from 'jmuxer';
import { deviceCommandsApi, devicesApi } from '../../api';
import './LiveStream.css';

const SOCKET_URL  = process.env.REACT_APP_SOCKET_URL  || '';
const MEDIA_IP    = process.env.REACT_APP_MEDIA_SERVER_IP   || window.location.hostname;
const MEDIA_PORT  = parseInt(process.env.REACT_APP_MEDIA_SERVER_PORT || '8880');
const IDLE_SEC    = 180;

// ── G.711 A-law decode table (built once at module load) ─────────────────────
// Maps each 8-bit A-law byte to a normalized float32 in [-1, 1].
const ALAW_DECODE = (() => {
  const t = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    let v = i ^ 0x55;
    const sign = (v & 0x80) ? -1 : 1;
    v &= 0x7f;
    const exp = v >> 4;
    const man = v & 0x0f;
    const linear = exp === 0 ? (man << 1) | 1 : ((man | 0x10) << exp) | (1 << (exp - 1));
    t[i] = sign * linear / 4096;
  }
  return t;
})();

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnlineDevice {
  imei: string;
  name?: string;
  plateNumber?: string;
}

type ChState = 'connecting' | 'live' | 'no-signal' | 'stopped';

interface Channel {
  imei: string;
  ch: number;
  state: ChState;
  hasFrame: boolean;
  fps: number;
  bitrate: number;
}

// ─── ChannelPlayer ────────────────────────────────────────────────────────────

interface CPProps {
  imei: string;
  ch: number;
  state: ChState;
  hasFrame: boolean;
  fps: number;
  bitrate: number;
  socketRef: React.MutableRefObject<Socket | null>;
  onFrame: () => void;
  onNoSignal: () => void;
}

function ChannelPlayer({ imei, ch, state, hasFrame, fps, bitrate, socketRef, onFrame, onNoSignal }: CPProps) {
  const videoId  = `vp-${imei}-${ch}`;
  const videoRef = useRef<HTMLVideoElement>(null);
  const jmuxRef  = useRef<any>(null);
  const mountRef = useRef(false);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMuted]           = useState(false);
  const mutedRef                    = useRef(muted);
  mutedRef.current = muted;

  // Web Audio API refs for G.711A playback
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef(0);
  const [hasAudio, setHasAudio] = useState(false);
  const hasAudioRef = useRef(false);
  // Tracks whether JMuxer actually decoded any video (separate from hasFrame which includes audio)
  const [hasVideo, setHasVideo] = useState(false);
  const hasVideoRef = useRef(false);

  // JMuxer init — handles H.264 video if/when the device sends it
  useEffect(() => {
    mountRef.current = true;
    const t = setTimeout(() => {
      if (!mountRef.current) return;
      try {
        jmuxRef.current = new JMuxer({
          node: videoId, mode: 'video', debug: false, fps: 25, flushingTime: 0,
          onError: () => {},
        });
      } catch (_) {}
    }, 150);
    const ns = setTimeout(() => { if (!hasFrame) onNoSignal(); }, 20_000);
    return () => {
      clearTimeout(t); clearTimeout(ns);
      mountRef.current = false;
      try { jmuxRef.current?.destroy(); } catch (_) {}
      jmuxRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      try { audioCtxRef.current?.close(); } catch (_) {}
    };
  }, []);

  // Video frame feed (H.264)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (p: any) => {
      if (p.imei !== imei || p.channel !== ch) return;
      if (!jmuxRef.current) return;
      try {
        const bytes = p.video instanceof Uint8Array
          ? p.video
          : new Uint8Array(
              p.video?.buffer ? p.video.buffer
                : p.video instanceof ArrayBuffer ? p.video
                  : Buffer.from(p.video).buffer,
            );
        jmuxRef.current.feed({ video: bytes });
        if (!hasVideoRef.current) {
          hasVideoRef.current = true;
          setHasVideo(true);
        }
        onFrame();
      } catch (_) {}
    };
    socket.on('frame', handler);
    return () => { socket.off('frame', handler); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imei, ch]);

  // Audio frame feed (G.711A A-law at 8 kHz)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = (p: any) => {
      if (p.imei !== imei || p.channel !== ch) return;
      try {
        const raw = p.audio;
        const bytes: Uint8Array =
          raw instanceof Uint8Array ? raw
          : raw instanceof ArrayBuffer ? new Uint8Array(raw)
          : new Uint8Array(Buffer.from(raw).buffer);

        // Initialize AudioContext lazily (browsers require user gesture)
        if (!audioCtxRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          audioCtxRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 8000 });
          nextPlayTimeRef.current = audioCtxRef.current!.currentTime;
        }
        const ctx = audioCtxRef.current!;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        if (!mutedRef.current) {
          // Decode G.711A → float32 PCM and schedule playback gaplessly
          const audioBuffer = ctx.createBuffer(1, bytes.length, 8000);
          const ch0 = audioBuffer.getChannelData(0);
          for (let i = 0; i < bytes.length; i++) ch0[i] = ALAW_DECODE[bytes[i]];
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          const now = ctx.currentTime;
          const startAt = Math.max(now, nextPlayTimeRef.current);
          source.start(startAt);
          nextPlayTimeRef.current = startAt + audioBuffer.duration;
        }

        if (!hasAudioRef.current) {
          hasAudioRef.current = true;
          setHasAudio(true);
        }
        onFrame(); // mark channel as LIVE
      } catch (_) {}
    };

    socket.on('audio_frame', handler);
    return () => { socket.off('audio_frame', handler); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imei, ch]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
    // For audio: suspend/resume the AudioContext
    if (audioCtxRef.current) {
      if (muted) audioCtxRef.current.suspend().catch(() => {});
      else       audioCtxRef.current.resume().catch(() => {});
    }
  }, [muted]);

  useEffect(() => {
    const fn = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', fn);
    return () => document.removeEventListener('fullscreenchange', fn);
  }, []);

  const goFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  const snapshot = () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      const c = document.createElement('canvas');
      c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720;
      c.getContext('2d')!.drawImage(v, 0, 0);
      const a = document.createElement('a');
      a.download = `snap_${imei}_ch${ch}_${Date.now()}.png`;
      a.href = c.toDataURL('image/png'); a.click();
      toast.success(`Snapshot saved — CH${ch}`);
    } catch (_) { toast.error('Snapshot failed'); }
  };

  const isLive = state === 'live';
  // audioOnly: audio has arrived but JMuxer hasn't decoded any actual video frames
  const audioOnly = hasAudio && !hasVideo;

  return (
    <div className="cp-root" ref={wrapRef}>
      {/* Header */}
      <div className="cp-header">
        <span className="cp-ch-label">CH {ch}</span>
        {isLive && fps > 0 && <span className="cp-stat">{fps}fps</span>}
        {isLive && bitrate > 0 && <span className="cp-stat">{bitrate}k</span>}
        {isLive && audioOnly && <span className="cp-stat cp-stat-audio">AUDIO</span>}
        <span className={`cp-dot ${state}`} />
      </div>

      {/* Video */}
      <div className="cp-video-area">
        <video id={videoId} ref={videoRef} className="cp-video" autoPlay muted playsInline />

        {/* Audio-only overlay */}
        {audioOnly && state === 'live' && (
          <div className="cp-overlay cp-overlay-audio">
            <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
              <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="1.5" opacity="0.3"/>
              <path d="M9 9a3 3 0 0 1 6 0v3a3 3 0 0 1-6 0V9z" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M7 13a5 5 0 0 0 10 0" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12" y1="18" x2="12" y2="20" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ color: '#22c55e', fontSize: 12, marginTop: 6 }}>
              {muted ? 'Audio (muted)' : 'Audio streaming'}
            </span>
          </div>
        )}

        {/* No signal */}
        {state === 'no-signal' && (
          <div className="cp-overlay cp-overlay-nosig">
            <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
              <path d="M2 2L22 22" stroke="#6e7681" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16.5 6.5A6 6 0 0 1 18 10M12 4a8 8 0 0 1 5.66 2.34M8.5 8.5A4 4 0 0 0 8 10M12 4a8 8 0 0 0-8 8M12 12a2 2 0 1 0 0-4" stroke="#6e7681" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>No Signal</span>
          </div>
        )}
        {/* Connecting */}
        {state === 'connecting' && (
          <div className="cp-overlay">
            <div className="cp-spinner" />
          </div>
        )}
        {/* Stopped */}
        {state === 'stopped' && (
          <div className="cp-overlay cp-overlay-stopped">
            <span>&#9632;</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="cp-controls">
        <button className="cp-btn" title={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted(m => !m)}>
          {muted
            ? <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97V10.18L16.45 12.63C16.48 12.43 16.5 12.22 16.5 12ZM19 12C19 12.94 18.8 13.82 18.46 14.64L19.97 16.15C20.63 14.91 21 13.5 21 12C21 7.72 18.01 4.14 14 3.23V5.29C16.89 6.16 19 8.83 19 12ZM4.27 3L3 4.27 7.73 9H3V15H7L12 20V13.27L16.25 17.52C15.58 18.04 14.83 18.45 14 18.7V20.76C15.38 20.45 16.63 19.82 17.68 18.96L19.73 21 21 19.73 12 10.73 4.27 3ZM12 4L9.91 6.09 12 8.18V4Z"/></svg>
            : <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M3 9V15H7L12 20V4L7 9H3ZM16.5 12A4.5 4.5 0 0 0 14 7.97V16.02A4.5 4.5 0 0 0 16.5 12ZM14 3.23V5.29C16.89 6.16 19 8.83 19 12C19 15.17 16.89 17.84 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23Z"/></svg>
          }
        </button>
        <button className="cp-btn" title="Snapshot" onClick={snapshot}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M20 5H16.83L15 3H9L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5ZM12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18ZM12 10C10.34 10 9 11.34 9 13C9 14.66 10.34 16 12 16C13.66 16 15 14.66 15 13C15 11.34 13.66 10 12 10Z"/></svg>
        </button>
        <button className="cp-btn" title={fullscreen ? 'Exit' : 'Fullscreen'} onClick={goFullscreen}>
          {fullscreen
            ? <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M5 16H8V19H10V14H5V16ZM8 8H5V10H10V5H8V8ZM14 19H16V16H19V14H14V19ZM16 8V5H14V10H19V8H16Z"/></svg>
            : <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M7 14H5V19H10V17H7V14ZM5 10H7V7H10V5H5V10ZM17 17H14V19H19V14H17V17ZM14 5V7H17V10H19V5H14Z"/></svg>
          }
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LiveStream() {
  const socketRef      = useRef<Socket | null>(null);
  const [connected, setConnected]         = useState(false);
  const [devices, setDevices]             = useState<OnlineDevice[]>([]);
  const [watchImei, setWatchImei]         = useState<string | null>(null);
  const [watchName, setWatchName]         = useState('');
  const [chCount, setChCount]             = useState(4);
  const [channels, setChannels]           = useState<Map<number, Channel>>(new Map());
  const [idleLeft, setIdleLeft]           = useState(IDLE_SEC);
  const [showIdleWarn, setShowIdleWarn]   = useState(false);
  const lastActivityRef                   = useRef(Date.now());
  const idleTimerRef                      = useRef<ReturnType<typeof setInterval> | null>(null);
  const statRef      = useRef<Map<number, { fps: number; bits: number; last: number }>>(new Map());
  const watchImeiRef = useRef<string | null>(null);
  watchImeiRef.current = watchImei;

  // ── Socket (created once) ───────────────────────────────────────────────────

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const socket = io(`${SOCKET_URL}/media`, {
      auth: { token }, transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // FPS / bitrate stats — track from both frame and audio_frame events
    const trackStats = (p: any, byteField: 'video' | 'audio') => {
      const ch = p.channel;
      if (p.imei !== watchImeiRef.current) return;
      if (!statRef.current.has(ch)) {
        statRef.current.set(ch, { fps: 0, bits: 0, last: Date.now() });
      }
      const s = statRef.current.get(ch)!;
      s.fps++;
      const payload = p[byteField];
      s.bits += (payload?.length ?? payload?.byteLength ?? 0) * 8;
      const now = Date.now();
      if (now - s.last >= 1000) {
        const fps     = s.fps;
        const bitrate = Math.round(s.bits / 1000);
        s.fps = 0; s.bits = 0; s.last = now;
        setChannels(prev => {
          const next = new Map(prev);
          const c = next.get(ch);
          if (c) next.set(ch, { ...c, fps, bitrate });
          return next;
        });
      }
    };

    socket.on('frame',       (p: any) => trackStats(p, 'video'));
    socket.on('audio_frame', (p: any) => trackStats(p, 'audio'));

    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load online devices ─────────────────────────────────────────────────────

  useEffect(() => {
    devicesApi.getAll().then((res: any) => {
      const list = (res.data || []).map((d: any) => ({
        imei: d.imei,
        name: d.name,
        plateNumber: d.plateNumber,
      }));
      setDevices(list);
    }).catch(() => {});
  }, []);

  // ── Activity tracking for idle timer ───────────────────────────────────────

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowIdleWarn(false);
    setIdleLeft(IDLE_SEC);
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetActivity, { passive: true }));
    return () => { events.forEach(e => document.removeEventListener(e, resetActivity)); };
  }, [resetActivity]);

  useEffect(() => {
    if (!watchImei) {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
      return;
    }
    idleTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const left    = Math.max(0, IDLE_SEC - elapsed);
      setIdleLeft(left);
      if (left <= 30) setShowIdleWarn(true);
      if (left === 0) stopAllStreams();
    }, 1000);
    return () => { if (idleTimerRef.current) clearInterval(idleTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchImei]);

  // ── Start watching a device ─────────────────────────────────────────────────

  const watchDevice = useCallback(async (device: OnlineDevice, count: number) => {
    setWatchImei(device.imei);
    setWatchName(device.name || device.plateNumber || device.imei);
    setChCount(count);
    resetActivity();
    statRef.current.clear();

    const initMap = new Map<number, Channel>();
    for (let ch = 1; ch <= count; ch++) {
      initMap.set(ch, {
        imei: device.imei, ch, state: 'connecting',
        hasFrame: false, fps: 0, bitrate: 0,
      });
    }
    setChannels(initMap);

    const socket = socketRef.current;
    for (let ch = 1; ch <= count; ch++) {
      socket?.emit('subscribe_stream', { imei: device.imei, channel: ch });
    }

    // Send 0x9101 for each channel staggered 200ms apart
    for (let ch = 1; ch <= count; ch++) {
      const thisCh = ch;
      setTimeout(async () => {
        try {
          await deviceCommandsApi.requestVideo(device.imei, {
            channel: thisCh,
            serverIp: MEDIA_IP,
            serverTcpPort: MEDIA_PORT,
            dataType: 0,     // 0 = audio+video
            streamType: 0,   // 0 = main stream
          });
        } catch (_) {}
      }, (ch - 1) * 200);
    }
  }, [resetActivity]);

  // ── Stop all streams ────────────────────────────────────────────────────────

  const stopAllStreams = useCallback(() => {
    if (!watchImei) return;
    const socket = socketRef.current;
    setChannels(prev => {
      const next = new Map(prev);
      next.forEach((c, ch) => {
        next.set(ch, { ...c, state: 'stopped' });
        socket?.emit('unsubscribe_stream', { imei: watchImei, channel: ch });
      });
      return next;
    });
    deviceCommandsApi.videoControl?.(watchImei, { channel: 0, command: 0 }).catch(() => {});
    setWatchImei(null);
    setShowIdleWarn(false);
  }, [watchImei]);

  // ── Frame and no-signal callbacks ──────────────────────────────────────────

  const handleFrame = useCallback((ch: number) => {
    setChannels(prev => {
      const c = prev.get(ch);
      if (!c || c.hasFrame) return prev;
      const next = new Map(prev);
      next.set(ch, { ...c, hasFrame: true, state: 'live' });
      return next;
    });
  }, []);

  const handleNoSignal = useCallback((ch: number) => {
    setChannels(prev => {
      const c = prev.get(ch);
      if (!c || c.hasFrame || c.state === 'stopped') return prev;
      const next = new Map(prev);
      next.set(ch, { ...c, state: 'no-signal' });
      return next;
    });
  }, []);

  const chList = useMemo(() => Array.from(channels.values()), [channels]);
  const liveCount = chList.filter(c => c.state === 'live').length;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="ls-root" onMouseMove={resetActivity} onKeyDown={resetActivity}>

      {/* ── Top bar ── */}
      <div className="ls-topbar">
        <div className="ls-topbar-left">
          <h1 className="ls-title">Live Video Streams</h1>
          <div className="ls-status-bar">
            <span className="ls-dot" style={{ background: connected ? '#22c55e' : '#ef4444' }} />
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
            {watchImei && liveCount > 0 && (
              <span className="ls-live-chip">{liveCount} LIVE</span>
            )}
          </div>
        </div>
        {watchImei && (
          <div className="ls-topbar-right">
            {showIdleWarn && (
              <span className="ls-idle-warn">
                Auto-stop in {idleLeft}s
              </span>
            )}
            <button className="ls-stop-all" onClick={stopAllStreams}>
              &#9632; Stop All
            </button>
          </div>
        )}
      </div>

      <div className="ls-body">

        {/* ── Left panel — device list ── */}
        <aside className="ls-panel">
          <div className="ls-panel-header">
            <span>Devices</span>
            <span className="ls-panel-count">{devices.length}</span>
          </div>

          <div className="ls-ch-selector">
            <span className="ls-ch-label">Channels:</span>
            {[1, 2, 4, 6, 8].map(n => (
              <button
                key={n}
                className={`ls-ch-btn ${chCount === n ? 'ls-ch-btn-active' : ''}`}
                onClick={() => setChCount(n)}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="ls-device-list">
            {devices.length === 0 ? (
              <div className="ls-panel-empty">No devices found</div>
            ) : (
              devices.map(d => {
                const isWatching = watchImei === d.imei;
                return (
                  <div
                    key={d.imei}
                    className={`ls-device-card ${isWatching ? 'ls-device-card-active' : ''}`}
                    onClick={() => {
                      if (isWatching) stopAllStreams();
                      else watchDevice(d, chCount);
                    }}
                  >
                    <div className="ls-device-card-top">
                      <span className="ls-device-name">{d.name || d.plateNumber || 'Device'}</span>
                      {isWatching && <span className="ls-watching-badge">LIVE</span>}
                    </div>
                    <div className="ls-device-imei">{d.imei}</div>
                    <div className="ls-device-action">
                      {isWatching
                        ? <span className="ls-action-stop">Click to stop</span>
                        : <span className="ls-action-watch">▶ Watch {chCount} CH</span>
                      }
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Main video area ── */}
        <main className="ls-main">
          {!watchImei ? (
            <div className="ls-placeholder">
              <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
                <rect x="4" y="12" width="56" height="36" rx="4" stroke="#30363d" strokeWidth="3"/>
                <rect x="12" y="18" width="18" height="12" rx="2" stroke="#30363d" strokeWidth="2"/>
                <rect x="34" y="18" width="18" height="12" rx="2" stroke="#30363d" strokeWidth="2"/>
                <rect x="12" y="34" width="18" height="8" rx="2" stroke="#30363d" strokeWidth="2"/>
                <rect x="34" y="34" width="18" height="8" rx="2" stroke="#30363d" strokeWidth="2"/>
                <path d="M24 52H40M32 48V52" stroke="#30363d" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <p>Select a device from the left panel</p>
              <p className="ls-placeholder-sub">All {chCount} channels will open simultaneously</p>
            </div>
          ) : (
            <div className="ls-watch-container">
              <div className="ls-watch-titlebar">
                <div className="ls-watch-info">
                  <span className="ls-watch-name">{watchName}</span>
                  <span className="ls-watch-imei">{watchImei}</span>
                  <span className="ls-watch-channels">{chCount} channels</span>
                </div>
                {showIdleWarn && (
                  <div className="ls-idle-bar">
                    <div
                      className="ls-idle-fill"
                      style={{ width: `${(idleLeft / IDLE_SEC) * 100}%` }}
                    />
                    <span className="ls-idle-text">
                      Auto-stop in {idleLeft}s — move mouse to continue
                    </span>
                  </div>
                )}
              </div>

              <div className={`ls-ch-grid ls-ch-grid-${chCount}`}>
                {chList.map(c => (
                  <div key={c.ch} className="ls-ch-cell">
                    <ChannelPlayer
                      imei={c.imei}
                      ch={c.ch}
                      state={c.state}
                      hasFrame={c.hasFrame}
                      fps={c.fps}
                      bitrate={c.bitrate}
                      socketRef={socketRef}
                      onFrame={() => handleFrame(c.ch)}
                      onNoSignal={() => handleNoSignal(c.ch)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
