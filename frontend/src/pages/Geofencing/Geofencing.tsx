import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Polygon, useMapEvents, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geofencesApi, devicesApi } from '../../api';
import { Geofence, Device } from '../../types';
import { toast } from 'react-toastify';
import './Geofencing.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick }: { onMapClick: (latlng: [number, number]) => void }) {
  useMapEvents({
    click: (e) => onMapClick([e.latlng.lat, e.latlng.lng]),
  });
  return null;
}

export default function Geofencing() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selected, setSelected] = useState<Geofence | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [form, setForm] = useState<any>({
    name: '', type: 'circle', color: '#0ea5e9', radius: 500,
    alertOnEnter: true, alertOnExit: true, isActive: true, coordinates: null,
  });

  useEffect(() => {
    geofencesApi.getAll().then((r) => setGeofences(r.data));
    devicesApi.getAll().then((r) => setDevices(r.data));
  }, []);

  const handleMapClick = (latlng: [number, number]) => {
    if (!drawing) return;
    if (form.type === 'circle') {
      setForm((f: any) => ({ ...f, coordinates: latlng }));
      toast.info('Center set! Click Save to create geofence.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.coordinates) {
      toast.error('Click on map to set location first');
      return;
    }
    try {
      if (selected) {
        await geofencesApi.update(selected.id, form);
        toast.success('Geofence updated');
      } else {
        await geofencesApi.create(form);
        toast.success('Geofence created');
      }
      const r = await geofencesApi.getAll();
      setGeofences(r.data);
      setShowForm(false);
      setDrawing(false);
      setSelected(null);
      setForm({ name: '', type: 'circle', color: '#0ea5e9', radius: 500, alertOnEnter: true, alertOnExit: true, isActive: true, coordinates: null });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving geofence');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this geofence?')) return;
    await geofencesApi.delete(id);
    setGeofences((prev) => prev.filter((g) => g.id !== id));
    toast.success('Geofence deleted');
  };

  const startDrawing = () => {
    setSelected(null);
    setDrawing(true);
    setShowForm(true);
    setForm({ name: '', type: 'circle', color: '#0ea5e9', radius: 500, alertOnEnter: true, alertOnExit: true, isActive: true, coordinates: null });
    toast.info('Click on the map to place the geofence center');
  };

  return (
    <div className="geofencing-page">
      <div className="geofencing-layout">
        <div className="geofence-panel">
          <div className="panel-header">
            <h3>Geofences ({geofences.length})</h3>
            <button className="btn-primary" onClick={startDrawing}>+ Add</button>
          </div>

          {showForm && (
            <form onSubmit={handleSave} className="geofence-form">
              <input
                type="text"
                placeholder="Geofence name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="circle">Circle</option>
                <option value="polygon">Polygon</option>
              </select>
              {form.type === 'circle' && (
                <input
                  type="number"
                  placeholder="Radius (meters)"
                  value={form.radius}
                  onChange={(e) => setForm({ ...form, radius: +e.target.value })}
                />
              )}
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                title="Geofence color"
              />
              <label className="checkbox-label">
                <input type="checkbox" checked={form.alertOnEnter} onChange={(e) => setForm({ ...form, alertOnEnter: e.target.checked })} />
                Alert on Enter
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={form.alertOnExit} onChange={(e) => setForm({ ...form, alertOnExit: e.target.checked })} />
                Alert on Exit
              </label>
              {form.coordinates && (
                <div className="coords-display">
                  📍 {form.coordinates[0].toFixed(4)}, {form.coordinates[1].toFixed(4)}
                </div>
              )}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setDrawing(false); }}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          )}

          <div className="geofence-list">
            {geofences.map((g) => (
              <div
                key={g.id}
                className={`geofence-item ${selected?.id === g.id ? 'selected' : ''}`}
                onClick={() => setSelected(selected?.id === g.id ? null : g)}
              >
                <span className="geofence-color" style={{ background: g.color }}></span>
                <div className="geofence-info">
                  <span className="geofence-name">{g.name}</span>
                  <span className="geofence-type">{g.type} {g.radius ? `• ${g.radius}m` : ''}</span>
                </div>
                <div className="geofence-actions">
                  <span className={`active-badge ${g.isActive ? 'on' : 'off'}`}>
                    {g.isActive ? 'Active' : 'Off'}
                  </span>
                  <button className="btn-icon danger" onClick={(e) => { e.stopPropagation(); handleDelete(g.id); }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="geofence-map">
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {drawing && <MapClickHandler onMapClick={handleMapClick} />}

            {geofences.map((g) => {
              if (g.type === 'circle' && g.coordinates) {
                const [lat, lng] = g.coordinates;
                return (
                  <Circle
                    key={g.id}
                    center={[lat, lng]}
                    radius={g.radius || 500}
                    pathOptions={{ color: g.color, fillColor: g.color, fillOpacity: 0.15, weight: selected?.id === g.id ? 3 : 1.5 }}
                  >
                    <Popup><strong>{g.name}</strong></Popup>
                  </Circle>
                );
              }
              if (g.type === 'polygon' && g.coordinates) {
                return (
                  <Polygon
                    key={g.id}
                    positions={g.coordinates}
                    pathOptions={{ color: g.color, fillColor: g.color, fillOpacity: 0.15 }}
                  >
                    <Popup><strong>{g.name}</strong></Popup>
                  </Polygon>
                );
              }
              return null;
            })}

            {drawing && form.coordinates && form.type === 'circle' && (
              <Circle
                center={form.coordinates}
                radius={form.radius || 500}
                pathOptions={{ color: form.color, fillColor: form.color, fillOpacity: 0.2, dashArray: '5 5' }}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
