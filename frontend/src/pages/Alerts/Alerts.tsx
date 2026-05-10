import React, { useEffect, useState } from 'react';
import { alertsApi, devicesApi } from '../../api';
import { Alert, Device } from '../../types';
import { useSocket } from '../../hooks/useSocket';
import { toast } from 'react-toastify';
import './Alerts.css';

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'];
const severityColor: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e',
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ severity: '', isRead: '', deviceId: '' });
  const [page, setPage] = useState(0);
  const { newAlert } = useSocket();
  const limit = 20;

  useEffect(() => {
    devicesApi.getAll().then((r) => setDevices(r.data));
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [filter, page]);

  useEffect(() => {
    if (newAlert) {
      toast.error(`🚨 ${newAlert.type}: ${newAlert.deviceName || newAlert.imei}`, { autoClose: 5000 });
      loadAlerts();
    }
  }, [newAlert]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params: any = { limit, offset: page * limit };
      if (filter.severity) params.severity = filter.severity;
      if (filter.isRead) params.isRead = filter.isRead;
      if (filter.deviceId) params.deviceId = filter.deviceId;
      const r = await alertsApi.getAll(params);
      setAlerts(r.data.alerts || []);
      setTotal(r.data.total || 0);
    } finally { setLoading(false); }
  };

  const handleMarkRead = async (id: number) => {
    await alertsApi.markAsRead(id);
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isRead: true } : a));
  };

  const handleMarkAllRead = async () => {
    await alertsApi.markAllAsRead();
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    toast.success('All alerts marked as read');
  };

  return (
    <div className="alerts-page">
      <div className="alerts-toolbar">
        <div className="filter-group">
          <select
            value={filter.severity}
            onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
          >
            <option value="">All Severities</option>
            {SEVERITY_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filter.isRead}
            onChange={(e) => setFilter({ ...filter, isRead: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
          <select
            value={filter.deviceId}
            onChange={(e) => setFilter({ ...filter, deviceId: e.target.value })}
          >
            <option value="">All Vehicles</option>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <button className="btn-secondary" onClick={handleMarkAllRead}>Mark All Read</button>
      </div>

      {loading ? (
        <div className="loading">Loading alerts...</div>
      ) : (
        <>
          <div className="alerts-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Type</th>
                  <th>Vehicle</th>
                  <th>Message</th>
                  <th>Speed</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className={!a.isRead ? 'unread' : ''}>
                    <td>
                      <span
                        className="sev-badge"
                        style={{ background: severityColor[a.severity] }}
                      >
                        {a.severity}
                      </span>
                    </td>
                    <td className="alert-type">{a.type.replace(/_/g, ' ')}</td>
                    <td>{a.deviceName || a.imei}</td>
                    <td className="text-muted">{a.message || '—'}</td>
                    <td>{a.speed ? `${Math.round(a.speed)} km/h` : '—'}</td>
                    <td className="text-muted">
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td>
                      {a.isRead
                        ? <span className="badge-read">Read</span>
                        : <span className="badge-unread">Unread</span>
                      }
                    </td>
                    <td>
                      {!a.isRead && (
                        <button
                          className="btn-sm"
                          onClick={() => handleMarkRead(a.id)}
                        >
                          Mark Read
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {alerts.length === 0 && <div className="empty-table">No alerts found</div>}
          </div>

          <div className="pagination">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span>Page {page + 1} of {Math.ceil(total / limit) || 1}</span>
            <button disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </>
      )}
    </div>
  );
}
