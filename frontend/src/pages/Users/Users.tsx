import React, { useEffect, useState } from 'react';
import { usersApi } from '../../api';
import { User } from '../../types';
import { toast } from 'react-toastify';
import '../Devices/Devices.css';
import './Users.css';

const ROLES = ['super_admin', 'admin', 'manager', 'operator', 'viewer'];

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try { const r = await usersApi.getAll(); setUsers(r.data); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ role: 'operator', isActive: true });
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ ...u, password: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (editUser) {
        await usersApi.update(editUser.id, data);
        toast.success('User updated');
      } else {
        await usersApi.create(data);
        toast.success('User created');
      }
      setShowModal(false);
      loadUsers();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Deactivate this user?')) return;
    await usersApi.delete(id);
    toast.success('User deactivated');
    loadUsers();
  };

  const roleColor: Record<string, string> = {
    super_admin: '#7c3aed', admin: '#0ea5e9', manager: '#059669', operator: '#f59e0b', viewer: '#64748b',
  };

  return (
    <div className="devices-page">
      <div className="page-toolbar">
        <h2 style={{ margin: 0 }}>User Management</h2>
        <button className="btn-primary" onClick={openCreate}>+ Add User</button>
      </div>

      {loading ? <div className="loading">Loading...</div> : (
        <div className="devices-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Username</th><th>Email</th><th>Role</th>
                <th>Status</th><th>Last Login</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName || '—'}</td>
                  <td className="mono">{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="role-badge" style={{ background: roleColor[u.role] + '20', color: roleColor[u.role] }}>
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={u.isActive ? 'active-status' : 'inactive-status'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-muted">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" onClick={() => openEdit(u)}>✏</button>
                      <button className="btn-icon danger" onClick={() => handleDelete(u.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editUser ? 'Edit User' : 'Add User'}</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-col">
                  <label>Full Name</label>
                  <input value={form.fullName || ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div className="form-col">
                  <label>Username *</label>
                  <input value={form.username || ''} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-col">
                  <label>Email *</label>
                  <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-col">
                  <label>{editUser ? 'New Password' : 'Password *'}</label>
                  <input
                    type="password"
                    value={form.password || ''}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editUser}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-col">
                  <label>Role</label>
                  <select value={form.role || 'operator'} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="form-col">
                  <label>Phone</label>
                  <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editUser ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
