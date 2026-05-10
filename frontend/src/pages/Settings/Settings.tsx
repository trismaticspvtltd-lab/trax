import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import { toast } from 'react-toastify';
import './Settings.css';

export default function Settings() {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState({ old: '', new1: '', new2: '' });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new1 !== passwords.new2) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.new1.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword({ oldPassword: passwords.old, newPassword: passwords.new1 });
      toast.success('Password changed successfully');
      setPasswords({ old: '', new1: '', new2: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  return (
    <div className="settings-page">
      <div className="settings-section">
        <h2>Account Information</h2>
        <div className="settings-card">
          <div className="info-row"><span>Username</span><strong>{user?.username}</strong></div>
          <div className="info-row"><span>Email</span><strong>{user?.email}</strong></div>
          <div className="info-row"><span>Full Name</span><strong>{user?.fullName || '—'}</strong></div>
          <div className="info-row"><span>Role</span><strong className="role-val">{user?.role?.replace(/_/g, ' ')}</strong></div>
        </div>
      </div>

      <div className="settings-section">
        <h2>Change Password</h2>
        <div className="settings-card">
          <form onSubmit={handleChangePassword} className="pass-form">
            <div className="form-col">
              <label>Current Password</label>
              <input
                type="password"
                value={passwords.old}
                onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
                required
              />
            </div>
            <div className="form-col">
              <label>New Password</label>
              <input
                type="password"
                value={passwords.new1}
                onChange={(e) => setPasswords({ ...passwords, new1: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="form-col">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwords.new2}
                onChange={(e) => setPasswords({ ...passwords, new2: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      <div className="settings-section">
        <h2>System Information</h2>
        <div className="settings-card">
          <div className="info-row"><span>Platform</span><strong>Traxlogi GPS Fleet Management</strong></div>
          <div className="info-row"><span>Version</span><strong>1.0.0</strong></div>
          <div className="info-row"><span>Protocol</span><strong>JT/T 808-2011 + JT/T 1078-2016</strong></div>
          <div className="info-row"><span>TCP Port</span><strong>8808</strong></div>
          <div className="info-row"><span>API Base</span><strong>{process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}</strong></div>
        </div>
      </div>
    </div>
  );
}
