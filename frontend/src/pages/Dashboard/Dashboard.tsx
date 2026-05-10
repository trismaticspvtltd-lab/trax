import React, { useEffect, useState } from 'react';
import { devicesApi, alertsApi, tripsApi } from '../../api';
import { DeviceStats, AlertStats } from '../../types';
import { useSocket } from '../../hooks/useSocket';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './Dashboard.css';

export default function Dashboard() {
  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
  const [alertStats, setAlertStats] = useState<AlertStats | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [tripStats, setTripStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { liveUpdates } = useSocket();

  useEffect(() => {
    Promise.all([
      devicesApi.getStats(),
      alertsApi.getStats(),
      alertsApi.getAll({ limit: 10, isResolved: 'false' }),
      tripsApi.getStats(),
    ]).then(([d, a, alerts, t]) => {
      setDeviceStats(d.data);
      setAlertStats(a.data);
      setRecentAlerts(alerts.data.alerts || []);
      setTripStats(t.data);
    }).finally(() => setLoading(false));
  }, []);

  const statCards = deviceStats ? [
    { label: 'Total Vehicles', value: deviceStats.total, icon: '🚗', color: '#0ea5e9', bg: '#e0f2fe' },
    { label: 'Moving', value: deviceStats.moving, icon: '▶', color: '#22c55e', bg: '#dcfce7' },
    { label: 'Idle', value: deviceStats.idle, icon: '⏸', color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Offline', value: deviceStats.offline, icon: '⭘', color: '#ef4444', bg: '#fee2e2' },
  ] : [];

  const liveCount = liveUpdates.size;
  const movingCount = Array.from(liveUpdates.values()).filter(v => v.status === 'moving').length;

  const severityColor: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#22c55e',
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-info">
              <span className="stat-value">{card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-row">
        <div className="dash-section live-status">
          <h2>Live Status</h2>
          <div className="live-grid">
            <div className="live-card">
              <span className="live-num">{liveCount}</span>
              <span className="live-lbl">Connected Now</span>
            </div>
            <div className="live-card moving">
              <span className="live-num">{movingCount}</span>
              <span className="live-lbl">Moving Now</span>
            </div>
            {alertStats && (
              <>
                <div className="live-card warn">
                  <span className="live-num">{alertStats.unread}</span>
                  <span className="live-lbl">Unread Alerts</span>
                </div>
                <div className="live-card danger">
                  <span className="live-num">{alertStats.critical}</span>
                  <span className="live-lbl">Critical Alerts</span>
                </div>
              </>
            )}
          </div>
        </div>

        {tripStats && (
          <div className="dash-section trip-summary">
            <h2>Trip Summary</h2>
            <div className="trip-stats">
              <div className="trip-stat">
                <span className="trip-num">{tripStats.total}</span>
                <span className="trip-lbl">Total Trips</span>
              </div>
              <div className="trip-stat">
                <span className="trip-num">{Math.round(tripStats.totalDistance)} km</span>
                <span className="trip-lbl">Total Distance</span>
              </div>
              <div className="trip-stat">
                <span className="trip-num">{Math.round(tripStats.avgSpeed)} km/h</span>
                <span className="trip-lbl">Avg Speed</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-row">
        <div className="dash-section alerts-section">
          <div className="section-header">
            <h2>Recent Alerts</h2>
            <a href="/alerts" className="view-all">View All →</a>
          </div>
          <div className="alerts-list">
            {recentAlerts.length === 0 ? (
              <p className="empty-state">No recent alerts</p>
            ) : (
              recentAlerts.slice(0, 8).map((alert) => (
                <div key={alert.id} className="alert-row">
                  <span
                    className="alert-sev"
                    style={{ background: severityColor[alert.severity] }}
                  >
                    {alert.severity}
                  </span>
                  <div className="alert-info">
                    <span className="alert-type">{alert.type.replace(/_/g, ' ')}</span>
                    <span className="alert-device">{alert.deviceName || alert.imei}</span>
                  </div>
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dash-section live-vehicles">
          <div className="section-header">
            <h2>Live Vehicles</h2>
            <a href="/map" className="view-all">View Map →</a>
          </div>
          <div className="vehicle-list">
            {Array.from(liveUpdates.values()).slice(0, 8).map((v) => (
              <div key={v.deviceId} className="vehicle-row">
                <div className={`vehicle-status-dot ${v.status}`}></div>
                <div className="vehicle-info">
                  <span className="vehicle-name">{v.name}</span>
                  <span className="vehicle-plate">{v.plateNumber}</span>
                </div>
                <div className="vehicle-speed">
                  <span className={v.speed > 0 ? 'speed-moving' : 'speed-stop'}>
                    {Math.round(v.speed)} km/h
                  </span>
                </div>
              </div>
            ))}
            {liveUpdates.size === 0 && (
              <p className="empty-state">No live vehicle data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
