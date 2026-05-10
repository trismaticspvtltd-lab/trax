import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { devicesApi, trackingApi, deviceCommandsApi } from '../../api';
import { Device } from '../../types';
import { useSocket } from '../../hooks/useSocket';
import './LiveMap.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createVehicleIcon(status: string, heading: number = 0) {
  const colors: Record<string, string> = {
    moving: '#22c55e',
    idle: '#f59e0b',
    offline: '#94a3b8',
    stopped: '#ef4444',
    alarm: '#dc2626',
    online: '#0ea5e9',
  };
  const color = colors[status] || '#64748b';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 56" width="32" height="44">
    <g transform="rotate(${heading}, 20, 20)">
      <ellipse cx="20" cy="20" rx="14" ry="18" fill="${color}" stroke="white" stroke-width="2.5"/>
      <polygon points="20,2 14,12 26,12" fill="white" opacity="0.9"/>
      <circle cx="20" cy="20" r="6" fill="white"/>
    </g>
    <circle cx="20" cy="50" r="4" fill="${color}" opacity="0.4"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: 'vehicle-marker',
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -44],
  });
}

function FlyToDevice({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 1.5 });
  }, [position, map]);
  return null;
}

export default function LiveMap() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [tripPath, setTripPath] = useState<[number, number][]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [cmdLoading, setCmdLoading] = useState<string | null>(null);
  const [textMsg, setTextMsg] = useState('');
  const { liveUpdates } = useSocket();

  useEffect(() => {
    devicesApi.getAll({ isActive: true }).then((r) => setDevices(r.data)).catch(() => {});
  }, []);

  const mergedDevices = devices.map((d) => {
    const live = liveUpdates.get(d.id);
    return live
      ? { ...d, latitude: live.latitude, longitude: live.longitude, speed: live.speed, status: live.status as any }
      : d;
  });

  const filtered = mergedDevices.filter((d) => {
    const matchStatus = filter === 'all' || d.status === filter;
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.plateNumber?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleDeviceClick = async (device: Device) => {
    setSelectedDevice(device);
    setTextMsg('');
    if (device.latitude && device.longitude) {
      setFlyTo([device.latitude, device.longitude]);
    }
    try {
      const end = new Date().toISOString();
      const start = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const res = await trackingApi.getHistory(device.id, start, end);
      const path: [number, number][] = res.data
        .filter((l: any) => l.latitude && l.longitude)
        .map((l: any) => [+l.latitude, +l.longitude]);
      setTripPath(path);
    } catch { setTripPath([]); }
  };

  const runCmd = async (key: string, fn: () => Promise<any>, successMsg: string) => {
    if (!selectedDevice) return;
    setCmdLoading(key);
    try {
      await fn();
      toast.success(successMsg);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Command failed: ${key}`);
    } finally {
      setCmdLoading(null);
    }
  };

  const handleLocate = () =>
    runCmd('locate', () => deviceCommandsApi.queryLocation(selectedDevice!.imei), 'Location query sent');

  const handlePhoto = () =>
    runCmd('photo', async () => {
      for (let ch = 1; ch <= 3; ch++) {
        await deviceCommandsApi.takePhoto(selectedDevice!.imei, { channel: ch, resolution: 0, quality: 1, flashMode: 0, saveFlag: 1 });
      }
    }, 'Photo capture requested (3 channels)');

  const handleVehicleControl = (action: string) =>
    runCmd(action, () => deviceCommandsApi.vehicleControl(selectedDevice!.imei, { flags: { [action]: true } }), `Command sent: ${action}`);

  const handleSendText = () => {
    if (!textMsg.trim()) return;
    runCmd('text', () => deviceCommandsApi.sendText(selectedDevice!.imei, { text: textMsg.trim(), type: 1, displayTime: 30 }), 'Message sent').then(() => setTextMsg(''));
  };

  const handleLiveStream = () => navigate('/livestream');

  const statusCounts = {
    all: mergedDevices.length,
    moving: mergedDevices.filter(d => d.status === 'moving').length,
    idle: mergedDevices.filter(d => d.status === 'idle').length,
    offline: mergedDevices.filter(d => d.status === 'offline').length,
  };

  const mapCenter: [number, number] = filtered.find(d => d.latitude)
    ? [filtered.find(d => d.latitude)!.latitude!, filtered.find(d => d.latitude)!.longitude!]
    : [20.5937, 78.9629];

  return (
    <div className="livemap-container">
      <div className="device-panel">
        <div className="panel-search">
          <input
            type="text"
            placeholder="Search vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-tabs">
          {[
            { key: 'all', label: 'All', color: '#64748b' },
            { key: 'moving', label: 'Moving', color: '#22c55e' },
            { key: 'idle', label: 'Idle', color: '#f59e0b' },
            { key: 'offline', label: 'Offline', color: '#ef4444' },
          ].map((f) => (
            <button
              key={f.key}
              className={`filter-tab ${filter === f.key ? 'active' : ''}`}
              style={{ '--tab-color': f.color } as any}
              onClick={() => setFilter(f.key)}
            >
              {f.label} ({statusCounts[f.key as keyof typeof statusCounts]})
            </button>
          ))}
        </div>

        <div className="device-list">
          {filtered.map((d) => (
            <div
              key={d.id}
              className={`device-item ${selectedDevice?.id === d.id ? 'selected' : ''}`}
              onClick={() => handleDeviceClick(d)}
            >
              <div className={`status-indicator ${d.status}`}></div>
              <div className="device-details">
                <span className="device-name">{d.name}</span>
                <span className="device-plate">{d.plateNumber || d.imei}</span>
                {d.speed !== undefined && (
                  <span className="device-speed">{Math.round(d.speed)} km/h</span>
                )}
              </div>
              <div className="device-meta">
                <span className={`status-badge ${d.status}`}>{d.status}</span>
                {d.lastUpdate && (
                  <span className="last-update">
                    {new Date(d.lastUpdate).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="no-devices">No vehicles found</div>
          )}
        </div>
      </div>

      <div className="map-area">
        <MapContainer
          center={mapCenter}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {flyTo && <FlyToDevice position={flyTo} />}

          {filtered
            .filter((d) => d.latitude && d.longitude)
            .map((d) => (
              <Marker
                key={d.id}
                position={[d.latitude!, d.longitude!]}
                icon={createVehicleIcon(d.status, d.heading)}
                eventHandlers={{ click: () => handleDeviceClick(d) }}
              >
                <Popup>
                  <div className="map-popup">
                    <strong>{d.name}</strong>
                    {d.plateNumber && <span>{d.plateNumber}</span>}
                    <span className={`popup-status ${d.status}`}>{d.status}</span>
                    <span>Speed: {Math.round(d.speed || 0)} km/h</span>
                    <span>Heading: {d.heading || 0}°</span>
                    {d.lastUpdate && (
                      <span>Last: {new Date(d.lastUpdate).toLocaleString()}</span>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

          {tripPath.length > 1 && (
            <Polyline positions={tripPath} color="#0ea5e9" weight={3} opacity={0.8} />
          )}
        </MapContainer>

        {selectedDevice && (
          <div className="info-panel">
            <button className="close-panel" onClick={() => { setSelectedDevice(null); setTripPath([]); }}>✕</button>
            <h3>{selectedDevice.name}</h3>

            <div className="info-rows">
              <div className="info-row"><span>Plate</span><span>{selectedDevice.plateNumber || '—'}</span></div>
              <div className="info-row"><span>IMEI</span><span className="mono-text">{selectedDevice.imei}</span></div>
              <div className="info-row">
                <span>Status</span>
                <span className={`badge ${selectedDevice.status}`}>{selectedDevice.status}</span>
              </div>
              <div className="info-row"><span>Speed</span><span>{Math.round(selectedDevice.speed || 0)} km/h</span></div>
              <div className="info-row"><span>Engine</span><span>{selectedDevice.engineOn ? '🟢 ON' : '🔴 OFF'}</span></div>
              {selectedDevice.fuelLevel && (
                <div className="info-row"><span>Fuel</span><span>{selectedDevice.fuelLevel}%</span></div>
              )}
              {selectedDevice.driverName && (
                <div className="info-row"><span>Driver</span><span>{selectedDevice.driverName}</span></div>
              )}
              <div className="info-row"><span>Lat</span><span>{selectedDevice.latitude != null ? Number(selectedDevice.latitude).toFixed(6) : '—'}</span></div>
              <div className="info-row"><span>Lng</span><span>{selectedDevice.longitude != null ? Number(selectedDevice.longitude).toFixed(6) : '—'}</span></div>
            </div>

            <div className="cmd-section">
              <div className="cmd-title">Commands</div>

              <div className="cmd-row">
                <button
                  className="cmd-btn cmd-btn-primary"
                  onClick={handleLocate}
                  disabled={cmdLoading !== null}
                  title="Request current location from device"
                >
                  {cmdLoading === 'locate' ? '…' : '📍 Locate'}
                </button>
                <button
                  className="cmd-btn cmd-btn-stream"
                  onClick={handleLiveStream}
                  title="Open live video stream"
                >
                  📹 Live Stream
                </button>
              </div>

              <div className="cmd-row">
                <button
                  className="cmd-btn cmd-btn-secondary"
                  onClick={handlePhoto}
                  disabled={cmdLoading !== null}
                  title="Capture photo from all 3 cameras"
                >
                  {cmdLoading === 'photo' ? '…' : '📷 Photo ×3'}
                </button>
              </div>

              <div className="cmd-group-label">Engine Control</div>
              <div className="cmd-row">
                <button
                  className="cmd-btn cmd-btn-danger"
                  onClick={() => handleVehicleControl('cutEngine')}
                  disabled={cmdLoading !== null}
                >
                  {cmdLoading === 'cutEngine' ? '…' : '✂ Cut Engine'}
                </button>
                <button
                  className="cmd-btn cmd-btn-success"
                  onClick={() => handleVehicleControl('restoreEngine')}
                  disabled={cmdLoading !== null}
                >
                  {cmdLoading === 'restoreEngine' ? '…' : '▶ Restore'}
                </button>
              </div>

              <div className="cmd-group-label">Door Control</div>
              <div className="cmd-row">
                <button
                  className="cmd-btn cmd-btn-warning"
                  onClick={() => handleVehicleControl('lockDoor')}
                  disabled={cmdLoading !== null}
                >
                  {cmdLoading === 'lockDoor' ? '…' : '🔒 Lock'}
                </button>
                <button
                  className="cmd-btn cmd-btn-secondary"
                  onClick={() => handleVehicleControl('unlockDoor')}
                  disabled={cmdLoading !== null}
                >
                  {cmdLoading === 'unlockDoor' ? '…' : '🔓 Unlock'}
                </button>
              </div>

              <div className="cmd-group-label">Send Message</div>
              <div className="cmd-text-row">
                <input
                  type="text"
                  className="cmd-text-input"
                  placeholder="Type message..."
                  value={textMsg}
                  onChange={(e) => setTextMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendText(); }}
                  maxLength={200}
                />
                <button
                  className="cmd-btn cmd-btn-primary cmd-send-btn"
                  onClick={handleSendText}
                  disabled={!textMsg.trim() || cmdLoading !== null}
                >
                  {cmdLoading === 'text' ? '…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
