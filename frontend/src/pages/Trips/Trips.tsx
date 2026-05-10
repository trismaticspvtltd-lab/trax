import React, { useEffect, useState } from 'react';
import { tripsApi, devicesApi, trackingApi } from '../../api';
import { Trip, Device } from '../../types';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Trips.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripPath, setTripPath] = useState<[number, number][]>([]);
  const [filter, setFilter] = useState({ deviceId: '', status: '' });
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    devicesApi.getAll().then((r) => setDevices(r.data));
  }, []);

  useEffect(() => {
    loadTrips();
  }, [filter, page]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const params: any = { limit, offset: page * limit };
      if (filter.deviceId) params.deviceId = filter.deviceId;
      if (filter.status) params.status = filter.status;
      const r = await tripsApi.getAll(params);
      setTrips(r.data.trips || []);
      setTotal(r.data.total || 0);
    } finally { setLoading(false); }
  };

  const handleTripClick = async (trip: Trip) => {
    setSelectedTrip(trip);
    try {
      const res = await trackingApi.getHistory(trip.deviceId, trip.startTime, trip.endTime || new Date().toISOString());
      const path: [number, number][] = res.data
        .filter((l: any) => l.latitude && l.longitude)
        .map((l: any) => [+l.latitude, +l.longitude]);
      setTripPath(path);
    } catch { setTripPath([]); }
  };

  return (
    <div className="trips-page">
      <div className="trips-toolbar">
        <select value={filter.deviceId} onChange={(e) => setFilter({ ...filter, deviceId: e.target.value })}>
          <option value="">All Vehicles</option>
          {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="trips-layout">
        <div className="trips-list-panel">
          {loading ? <div className="loading">Loading...</div> : (
            <>
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className={`trip-card ${selectedTrip?.id === trip.id ? 'selected' : ''}`}
                  onClick={() => handleTripClick(trip)}
                >
                  <div className="trip-header">
                    <span className={`trip-status ${trip.status}`}>{trip.status}</span>
                    <span className="trip-id">#{trip.id}</span>
                  </div>
                  <div className="trip-device">
                    {devices.find(d => d.id === trip.deviceId)?.name || trip.imei}
                  </div>
                  <div className="trip-times">
                    <span>🕐 {new Date(trip.startTime).toLocaleString()}</span>
                    {trip.endTime && <span>🕐 {new Date(trip.endTime).toLocaleString()}</span>}
                  </div>
                  <div className="trip-metrics">
                    <span>📍 {trip.distance.toFixed(1)} km</span>
                    <span>⚡ {Math.round(trip.maxSpeed)} km/h</span>
                    {trip.duration && <span>⏱ {formatDuration(trip.duration)}</span>}
                    {trip.driverName && <span>👤 {trip.driverName}</span>}
                  </div>
                </div>
              ))}
              {trips.length === 0 && <div className="empty-state">No trips found</div>}
              <div className="pagination">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span>{page + 1}/{Math.ceil(total / limit) || 1}</span>
                <button disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </>
          )}
        </div>

        <div className="trip-map-panel">
          {selectedTrip ? (
            <MapContainer
              center={tripPath[0] || [20.5937, 78.9629]}
              zoom={tripPath.length > 0 ? 13 : 5}
              style={{ height: '100%', width: '100%', borderRadius: 12 }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {tripPath.length > 1 && (
                <Polyline positions={tripPath} color="#0ea5e9" weight={4} opacity={0.9} />
              )}
              {tripPath.length > 0 && (
                <>
                  <Marker position={tripPath[0]} />
                  {tripPath.length > 1 && <Marker position={tripPath[tripPath.length - 1]} />}
                </>
              )}
            </MapContainer>
          ) : (
            <div className="map-placeholder">
              <span>Select a trip to view route</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
