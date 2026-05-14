import React, { useEffect, useState, useCallback } from 'react';
import { recordingsApi } from '../../api';
import './Recordings.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Recording {
  id: number;
  imei: string;
  deviceName: string;
  channel: number;
  type: 'alarm' | 'manual' | 'live';
  status: 'pending' | 'recording' | 'processing' | 'complete' | 'failed';
  alarmType?: string;
  alarmMessage?: string;
  s3VideoKey?: string;
  s3ImageKeys?: string[];
  videoUrl?: string;
  imageUrls?: string[];
  durationSeconds?: number;
  fileSizeBytes?: number;
  latitude?: number;
  longitude?: number;
  speed?: number;
  startTime: string;
  endTime?: string;
  createdAt: string;
}

interface RecordingsResponse {
  items: Recording[];
  total: number;
}

interface Filters {
  type: '' | 'alarm' | 'manual' | 'live';
  status: '' | 'complete' | 'failed' | 'pending';
  from: string;
  to: string;
  imei: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LIMIT = 20;

const ALARM_TYPE_LABELS: Record<string, string> = {
  sos: 'SOS Emergency',
  collision: 'Collision',
  rollover: 'Rollover',
  adasFCW: 'ADAS Forward Collision',
  adasLDW: 'ADAS Lane Departure',
  adasPCW: 'ADAS Pedestrian Warning',
  adasBSM: 'ADAS Blind Spot',
  dmsFatigue: 'DMS Fatigue',
  dmsDistraction: 'DMS Distraction',
  dmsPhone: 'DMS Phone Use',
  dmsSmoking: 'DMS Smoking',
  overSpeed: 'Overspeed',
  powerCut: 'Power Cut',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TypeBadgeProps { type: Recording['type'] }
function TypeBadge({ type }: TypeBadgeProps) {
  const cls = type === 'alarm' ? 'badge-alarm' : type === 'manual' ? 'badge-manual' : 'badge-live';
  const label = type.toUpperCase();
  return <span className={`rec-badge ${cls}`}>{label}</span>;
}

interface StatusBadgeProps { status: Recording['status'] }
function StatusBadge({ status }: StatusBadgeProps) {
  const cls = {
    complete: 'badge-complete',
    failed: 'badge-failed',
    processing: 'badge-processing',
    pending: 'badge-pending',
    recording: 'badge-processing',
  }[status] || 'badge-pending';
  const label = status === 'processing' || status === 'recording'
    ? `${status.charAt(0).toUpperCase() + status.slice(1)}…`
    : status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`rec-badge ${cls}`}>{label}</span>;
}

interface ThumbnailProps { imageKeys?: string[]; imageUrls?: string[] }
function Thumbnail({ imageUrls }: ThumbnailProps) {
  const src = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null;
  if (src) {
    return <img className="rec-thumbnail" src={src} alt="Recording thumbnail" />;
  }
  return (
    <div className="rec-thumbnail-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
      </svg>
      <span>No preview</span>
    </div>
  );
}

// ─── Modal Player ─────────────────────────────────────────────────────────────

interface ModalPlayerProps {
  recordingId: number;
  onClose: () => void;
}

function ModalPlayer({ recordingId, onClose }: ModalPlayerProps) {
  const [rec, setRec] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    recordingsApi.getOne(recordingId)
      .then((res) => setRec(res.data as Recording))
      .catch((err: any) => setError(err?.response?.data?.message || err.message || 'Failed to load recording'))
      .finally(() => setLoading(false));
  }, [recordingId]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container" role="dialog" aria-modal="true" aria-label="Recording player">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading && <div className="modal-loading">Loading recording…</div>}
        {error && <div className="modal-error">{error}</div>}

        {rec && !loading && (
          <>
            <div className="modal-header">
              <TypeBadge type={rec.type} />
              <StatusBadge status={rec.status} />
              <h2 className="modal-title">{rec.deviceName}</h2>
              <span className="modal-imei">{rec.imei} — Ch.{rec.channel}</span>
            </div>

            <div className="modal-video-wrap">
              {rec.videoUrl ? (
                <video
                  className="modal-video"
                  controls
                  src={rec.videoUrl}
                  preload="metadata"
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="modal-no-video">Video not available</div>
              )}
            </div>

            {rec.imageUrls && rec.imageUrls.length > 0 && (
              <div className="modal-images">
                {rec.imageUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Frame ${idx + 1}`}
                    className="modal-image-thumb"
                    onClick={() => setEnlargedImage(url)}
                  />
                ))}
              </div>
            )}

            <div className="modal-details">
              {rec.type === 'alarm' && rec.alarmType && (
                <div className="detail-row">
                  <span className="detail-label">Alarm</span>
                  <span className="detail-value alarm-value">
                    {ALARM_TYPE_LABELS[rec.alarmType] || rec.alarmType}
                    {rec.alarmMessage && ` — ${rec.alarmMessage}`}
                  </span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Time</span>
                <span className="detail-value">{formatDateTime(rec.startTime)}</span>
              </div>
              {rec.durationSeconds !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">Duration</span>
                  <span className="detail-value">{formatDuration(rec.durationSeconds)}</span>
                </div>
              )}
              {rec.latitude !== undefined && rec.longitude !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">Location</span>
                  <span className="detail-value">
                    {rec.latitude.toFixed(6)}, {rec.longitude.toFixed(6)}
                    {' '}
                    <a
                      className="maps-link"
                      href={`https://maps.google.com/?q=${rec.latitude},${rec.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View map
                    </a>
                  </span>
                </div>
              )}
              {rec.speed !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">Speed</span>
                  <span className="detail-value">{Math.round(rec.speed)} km/h</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {enlargedImage && (
        <div className="image-lightbox" onClick={() => setEnlargedImage(null)}>
          <img src={enlargedImage} alt="Enlarged frame" className="lightbox-img" />
        </div>
      )}
    </div>
  );
}

// ─── Recording Card ───────────────────────────────────────────────────────────

interface RecordingCardProps {
  recording: Recording;
  onPlay: (id: number) => void;
  onDelete: (id: number) => void;
}

function RecordingCard({ recording: rec, onPlay, onDelete }: RecordingCardProps) {
  const borderClass =
    rec.type === 'alarm' ? 'card-alarm' :
    rec.type === 'manual' ? 'card-manual' :
    'card-live';

  return (
    <div className={`rec-card ${borderClass}`}>
      <div className="card-thumb-area">
        <Thumbnail imageUrls={rec.imageUrls} imageKeys={rec.s3ImageKeys} />
        <div className="card-badges">
          <TypeBadge type={rec.type} />
          <StatusBadge status={rec.status} />
        </div>
      </div>

      <div className="card-body">
        {rec.type === 'alarm' && rec.alarmType && (
          <div className="card-alarm-label">
            {ALARM_TYPE_LABELS[rec.alarmType] || rec.alarmType}
          </div>
        )}

        <div className="card-device">
          <span className="device-name">{rec.deviceName}</span>
          <span className="device-imei">{rec.imei}</span>
        </div>

        <div className="card-meta">
          <span>{formatDateTime(rec.startTime)}</span>
        </div>

        <div className="card-stats">
          {rec.durationSeconds !== undefined && (
            <span className="stat-item">
              <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatDuration(rec.durationSeconds)}
            </span>
          )}
          {rec.fileSizeBytes !== undefined && (
            <span className="stat-item">
              <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
              {formatFileSize(rec.fileSizeBytes)}
            </span>
          )}
          {rec.latitude !== undefined && rec.longitude !== undefined && (
            <span className="stat-item">
              <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {rec.latitude.toFixed(4)}, {rec.longitude.toFixed(4)}
            </span>
          )}
          {rec.speed !== undefined && (
            <span className="stat-item">
              <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {Math.round(rec.speed)} km/h
            </span>
          )}
        </div>

        <div className="card-actions">
          <button
            className="btn-play"
            onClick={() => onPlay(rec.id)}
            disabled={rec.status !== 'complete'}
            title={rec.status !== 'complete' ? 'Recording not yet complete' : 'Play recording'}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>
          <button
            className="btn-delete"
            onClick={() => onDelete(rec.id)}
            title="Delete recording"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Recordings() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [playerRecordingId, setPlayerRecordingId] = useState<number | null>(null);

  const [pendingFilters, setPendingFilters] = useState<Filters>({
    type: '', status: '', from: '', to: '', imei: '',
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    type: '', status: '', from: '', to: '', imei: '',
  });

  const loadRecordings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: page + 1, limit: LIMIT };
      if (appliedFilters.type) params.type = appliedFilters.type;
      if (appliedFilters.status) params.status = appliedFilters.status;
      if (appliedFilters.imei) params.imei = appliedFilters.imei;
      if (appliedFilters.from) params.from = new Date(appliedFilters.from).toISOString();
      if (appliedFilters.to) params.to = new Date(appliedFilters.to).toISOString();

      const res = await recordingsApi.getAll(params);
      const data = res.data as RecordingsResponse;
      setRecordings(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load recordings:', err);
      setRecordings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters]);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const handleApplyFilters = () => {
    setPage(0);
    setAppliedFilters({ ...pendingFilters });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this recording? This action cannot be undone.')) return;
    try {
      await recordingsApi.remove(id);
      setRecordings((prev) => prev.filter((r) => r.id !== id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      alert('Failed to delete recording. Please try again.');
    }
  };

  const startIndex = page * LIMIT + 1;
  const endIndex = Math.min((page + 1) * LIMIT, total);
  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className="recordings-page">
      {/* ── Filter bar ── */}
      <div className="rec-filter-bar">
        <div className="filter-controls">
          <div className="filter-field">
            <label className="filter-label">Type</label>
            <select
              value={pendingFilters.type}
              onChange={(e) =>
                setPendingFilters((f) => ({ ...f, type: e.target.value as Filters['type'] }))
              }
            >
              <option value="">All Types</option>
              <option value="alarm">Alarm</option>
              <option value="manual">Manual</option>
              <option value="live">Live Stream</option>
            </select>
          </div>

          <div className="filter-field">
            <label className="filter-label">Status</label>
            <select
              value={pendingFilters.status}
              onChange={(e) =>
                setPendingFilters((f) => ({ ...f, status: e.target.value as Filters['status'] }))
              }
            >
              <option value="">All Statuses</option>
              <option value="complete">Complete</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="filter-field">
            <label className="filter-label">From</label>
            <input
              type="datetime-local"
              value={pendingFilters.from}
              onChange={(e) => setPendingFilters((f) => ({ ...f, from: e.target.value }))}
            />
          </div>

          <div className="filter-field">
            <label className="filter-label">To</label>
            <input
              type="datetime-local"
              value={pendingFilters.to}
              onChange={(e) => setPendingFilters((f) => ({ ...f, to: e.target.value }))}
            />
          </div>

          <div className="filter-field filter-field-imei">
            <label className="filter-label">IMEI</label>
            <input
              type="text"
              placeholder="Search by IMEI…"
              value={pendingFilters.imei}
              onChange={(e) => setPendingFilters((f) => ({ ...f, imei: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilters(); }}
            />
          </div>
        </div>

        <button className="btn-apply" onClick={handleApplyFilters}>
          Apply
        </button>
      </div>

      {/* ── Results summary ── */}
      {!loading && total > 0 && (
        <div className="results-summary">
          Showing {startIndex}–{endIndex} of {total} recording{total !== 1 ? 's' : ''}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="rec-loading">
          <div className="spinner" />
          Loading recordings…
        </div>
      ) : recordings.length === 0 ? (
        <div className="rec-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
          </svg>
          <p>No recordings found</p>
          <span>Try adjusting your filters</span>
        </div>
      ) : (
        <div className="rec-grid">
          {recordings.map((rec) => (
            <RecordingCard
              key={rec.id}
              recording={rec}
              onPlay={setPlayerRecordingId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && total > LIMIT && (
        <div className="pagination">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Previous
          </button>
          <span className="page-info">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Modal player ── */}
      {playerRecordingId !== null && (
        <ModalPlayer
          recordingId={playerRecordingId}
          onClose={() => setPlayerRecordingId(null)}
        />
      )}
    </div>
  );
}
