import React, { useEffect, useState } from 'react';
import { devicesApi } from '../../api';
import { Device } from '../../types';
import { useSocket } from '../../hooks/useSocket';
import { toast } from 'react-toastify';
import './Devices.css';

const VEHICLE_TYPES = ['car', 'truck', 'bus', 'motorcycle', 'van', 'other'];

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [form, setForm] = useState<any>({});
  const { liveUpdates } = useSocket();

  useEffect(() => { loadDevices(); }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const r = await devicesApi.getAll();
      setDevices(r.data);
    } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditDevice(null);
    setForm({ vehicleType: 'car', isActive: true });
    setShowModal(true);
  };

  const openEdit = (d: Device) => {
    setEditDevice(d);
    setForm({ ...d });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editDevice) {
        await devicesApi.update(editDevice.id, form);
        toast.success('Device updated');
      } else {
        await devicesApi.create(form);
        toast.success('Device created');
      }
      setShowModal(false);
      loadDevices();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving device');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Deactivate this device?')) return;
    try {
      await devicesApi.delete(id);
      toast.success('Device deactivated');
      loadDevices();
    } catch { toast.error('Error'); }
  };

  const merged = devices.map((d) => {
    const live = liveUpdates.get(d.id);
    return live ? { ...d, status: live.status as any, speed: live.speed } : d;
  });

  const filtered = merged.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.imei.includes(search) || d.plateNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    moving: '#22c55e', idle: '#f59e0b', offline: '#94a3b8', stopped: '#ef4444', alarm: '#dc2626', online: '#0ea5e9',
  };

  return (
    <div className="devices-page">
      <div className="page-toolbar">
        <input
          type="text"
          placeholder="Search by name, IMEI, plate..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="toolbar-search"
        />
        <button className="btn-primary" onClick={openCreate}>+ Add Device</button>
      </div>

      {loading ? (
        <div className="loading">Loading devices...</div>
      ) : (
        <div className="devices-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>IMEI</th>
                <th>Plate</th>
                <th>Type</th>
                <th>Status</th>
                <th>Speed</th>
                <th>Driver</th>
                <th>Last Update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="device-name-cell">
                      <span className="device-dot" style={{ background: statusColor[d.status] }}></span>
                      {d.name}
                    </div>
                  </td>
                  <td className="mono">{d.imei}</td>
                  <td>{d.plateNumber || '—'}</td>
                  <td className="capitalize">{d.vehicleType}</td>
                  <td>
                    <span className="status-pill" style={{ background: statusColor[d.status] + '20', color: statusColor[d.status] }}>
                      {d.status}
                    </span>
                  </td>
                  <td>{d.speed !== undefined ? `${Math.round(d.speed)} km/h` : '—'}</td>
                  <td>{d.driverName || '—'}</td>
                  <td className="text-muted">
                    {d.lastUpdate ? new Date(d.lastUpdate).toLocaleString() : '—'}
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" onClick={() => openEdit(d)} title="Edit">✏</button>
                      <button className="btn-icon danger" onClick={() => handleDelete(d.id)} title="Deactivate">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-table">No devices found</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editDevice ? 'Edit Device' : 'Add Device'}</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-col">
                  <label>Device Name *</label>
                  <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-col">
                  <label>IMEI *</label>
                  <input value={form.imei || ''} onChange={(e) => setForm({ ...form, imei: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-col">
                  <label>Plate Number</label>
                  <input value={form.plateNumber || ''} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} />
                </div>
                <div className="form-col">
                  <label>SIM Number</label>
                  <input value={form.simNumber || ''} onChange={(e) => setForm({ ...form, simNumber: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-col">
                  <label>Vehicle Type</label>
                  <select value={form.vehicleType || 'car'} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                    {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-col">
                  <label>Driver Name</label>
                  <input value={form.driverName || ''} onChange={(e) => setForm({ ...form, driverName: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-col">
                  <label>Group</label>
                  <input value={form.groupName || ''} onChange={(e) => setForm({ ...form, groupName: e.target.value })} />
                </div>
                <div className="form-col">
                  <label>Model</label>
                  <input value={form.model || ''} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editDevice ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
