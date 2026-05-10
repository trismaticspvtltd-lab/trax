import React, { useState, useEffect } from 'react';
import { reportsApi, devicesApi } from '../../api';
import { Device } from '../../types';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import './Reports.css';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [reportType, setReportType] = useState('mileage');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    devicesApi.getAll().then((r) => {
      setDevices(r.data);
      if (r.data[0]) setDeviceId(r.data[0].id.toString());
    });
  }, []);

  const handleGenerate = async () => {
    if (!deviceId) { return; }
    setLoading(true);
    try {
      let res: any;
      const start = new Date(startDate).toISOString();
      const end = new Date(endDate + 'T23:59:59').toISOString();
      if (reportType === 'mileage') res = await reportsApi.getMileage(+deviceId, start, end);
      else if (reportType === 'speed') res = await reportsApi.getSpeed(+deviceId, start, end);
      else if (reportType === 'alerts') res = await reportsApi.getAlerts(+deviceId, start, end);
      else if (reportType === 'trips') res = await reportsApi.getTrips(+deviceId, start, end);
      setData(res.data);
    } finally { setLoading(false); }
  };

  const handleFleetReport = async () => {
    setLoading(true);
    try {
      const start = new Date(startDate).toISOString();
      const end = new Date(endDate + 'T23:59:59').toISOString();
      const res = await reportsApi.getFleet(start, end);
      setData(res.data);
      setReportType('fleet');
    } finally { setLoading(false); }
  };

  return (
    <div className="reports-page">
      <div className="report-controls">
        <select value={reportType} onChange={(e) => { setReportType(e.target.value); setData(null); }}>
          <option value="mileage">Mileage Report</option>
          <option value="speed">Speed Report</option>
          <option value="alerts">Alert Report</option>
          <option value="trips">Trip Report</option>
        </select>
        <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
          {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Loading...' : 'Generate'}
        </button>
        <button className="btn-secondary" onClick={handleFleetReport} disabled={loading}>
          Fleet Summary
        </button>
      </div>

      {data && !loading && (
        <div className="report-content">
          {reportType === 'mileage' && Array.isArray(data) && (
            <div className="report-card">
              <h3>Daily Mileage</h3>
              <div className="report-summary">
                <div className="summary-item">
                  <span>Total Distance</span>
                  <strong>{data.reduce((s: number, d: any) => s + d.distance, 0).toFixed(1)} km</strong>
                </div>
                <div className="summary-item">
                  <span>Days Active</span>
                  <strong>{data.length}</strong>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="distance" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Distance (km)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {reportType === 'speed' && data.speedHistory && (
            <div className="report-card">
              <h3>Speed Analysis</h3>
              <div className="report-summary">
                <div className="summary-item"><span>Max Speed</span><strong>{Math.round(data.maxSpeed)} km/h</strong></div>
                <div className="summary-item"><span>Avg Speed</span><strong>{Math.round(data.avgSpeed)} km/h</strong></div>
                <div className="summary-item"><span>Speeding Events</span><strong>{data.speedingEvents?.length || 0}</strong></div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.speedHistory.slice(0, 200)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleDateString()} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                  <Line type="monotone" dataKey="speed" stroke="#0ea5e9" dot={false} name="Speed (km/h)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {reportType === 'alerts' && data.byType && (
            <div className="report-card">
              <h3>Alert Analysis</h3>
              <div className="report-summary">
                <div className="summary-item"><span>Total Alerts</span><strong>{data.total}</strong></div>
                <div className="summary-item"><span>Alert Types</span><strong>{Object.keys(data.byType).length}</strong></div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(data.byType).map(([k, v]) => ({ name: k.replace(/_/g, ' '), value: v }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {Object.keys(data.byType).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {reportType === 'trips' && data.trips && (
            <div className="report-card">
              <h3>Trip Report</h3>
              <div className="report-summary">
                <div className="summary-item"><span>Total Trips</span><strong>{data.total}</strong></div>
                <div className="summary-item"><span>Total Distance</span><strong>{data.totalDistance.toFixed(1)} km</strong></div>
                <div className="summary-item"><span>Avg Speed</span><strong>{data.avgSpeed} km/h</strong></div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Start</th><th>End</th><th>Distance</th><th>Max Speed</th><th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trips.slice(0, 20).map((t: any) => (
                    <tr key={t.id}>
                      <td>{new Date(t.startTime).toLocaleString()}</td>
                      <td>{t.endTime ? new Date(t.endTime).toLocaleString() : '—'}</td>
                      <td>{t.distance.toFixed(1)} km</td>
                      <td>{Math.round(t.maxSpeed)} km/h</td>
                      <td>{t.duration ? `${Math.floor(t.duration/60)}m` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'fleet' && Array.isArray(data) && (
            <div className="report-card">
              <h3>Fleet Summary</h3>
              <table className="data-table">
                <thead>
                  <tr><th>Vehicle</th><th>Plate</th><th>Trips</th><th>Distance</th><th>Alerts</th></tr>
                </thead>
                <tbody>
                  {data.map((row: any) => (
                    <tr key={row.device.id}>
                      <td>{row.device.name}</td>
                      <td>{row.device.plateNumber || '—'}</td>
                      <td>{row.trips}</td>
                      <td>{row.distance} km</td>
                      <td>{row.alerts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!data && !loading && (
        <div className="empty-report">Select options and click Generate to view report</div>
      )}
    </div>
  );
}
