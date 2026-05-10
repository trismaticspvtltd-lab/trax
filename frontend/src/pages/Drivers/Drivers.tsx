import React, { useEffect, useState } from 'react';
import { driversApi, devicesApi } from '../../api';
import { Driver, Device } from '../../types';
import { toast } from 'react-toastify';
import '../Devices/Devices.css';
import './Drivers.css';

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    Promise.all([
      driversApi.getAll().then((r) => setDrivers(r.data)),
      devicesApi.getAll().then((r) => setDevices(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditDriver(null);
    setForm({ isActive: true });
    setShowModal(true);
  };

  const openEdit = (d: Driver) => {
    setEditDriver(d);
    setForm({ ...d });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editDriver) {
        await driversApi.update(editDriver.id, form);
        toast.success('Driver updated');
      } else {
        await driversApi.create(form);
        toast.success('Driver created');
      }
      setShowModal(false);
      driversApi.getAll().then((r) => setDrivers(r.data));
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Deactivate this driver?')) return;
    await driversApi.delete(id);
    toast.success('Driver deactivated');
    driversApi.getAll().then((r) => setDrivers(r.data));
  };

  return (
    <div className="devices-page">
      <div className="page-toolbar">
        <h2 style={{ margin: 0 }}>Driver Management</h2>
        <button className="btn-primary" onClick={openCreate}>+ Add Driver</button>
      </div>

      {loading ? <div className="loading">Loading...</div> : (
        <div className="devices-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>License</th><th>Phone</th><th>Email</th>
                <th>Assigned Vehicle</th><th>License Expiry</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => {
                const device = devices.find(dev => dev.id === d.assignedDeviceId);
                return (
                  <tr key={d.id}>
                    <td className="driver-name-cell">
                      <div className="driver-avatar">{d.name[0]}</div>
                      {d.name}
                    </td>
                    <td className="mono">{d.licenseNumber || '—'}</td>
                    <td>{d.phone || '—'}</td>
                    <td>{d.email || '—'}</td>
                    <td>{device ? device.name : '—'}</td>
                    <td className="text-muted">
                      {d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <span className={d.isActive ? 'active-status' : 'inactive-status'}>
                        {d.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon" onClick={() => openEdit(d)}>✏</button>
                        <button className="btn-icon danger" onClick={() => handleDelete(d.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {drivers.length === 0 && <div className="empty-table">No drivers found</div>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editDriver ? 'Edit Driver' : 'Add Driver'}</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-col">
                  <label>Full Name *</label>
                  <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-col">
                  <label>License Number</label>
                  <input value={form.licenseNumber || ''} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-col">
                  <label>Phone</label>
                  <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-col">
                  <label>Email</label>
                  <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-col">
                  <label>Assign Vehicle</label>
                  <select value={form.assignedDeviceId || ''} onChange={(e) => setForm({ ...form, assignedDeviceId: e.target.value ? +e.target.value : null })}>
                    <option value="">None</option>
                    {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-col">
                  <label>License Expiry</label>
                  <input type="date" value={form.licenseExpiry?.split('T')[0] || ''} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} />
                </div>
              </div>
              <div className="form-col">
                <label>Address</label>
                <input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editDriver ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
