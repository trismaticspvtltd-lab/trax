import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: '⊞', label: 'Dashboard', exact: true },
  { path: '/map', icon: '🗺', label: 'Live Map' },
  { path: '/livestream', icon: '📹', label: 'Live Stream' },
  { path: '/recordings', icon: '🎬', label: 'Recordings' },
  { path: '/devices', icon: '📡', label: 'Devices' },
  { path: '/trips', icon: '🚗', label: 'Trips' },
  { path: '/alerts', icon: '🔔', label: 'Alerts' },
  { path: '/geofencing', icon: '📍', label: 'Geofencing' },
  { path: '/reports', icon: '📊', label: 'Reports' },
  { path: '/drivers', icon: '👤', label: 'Drivers' },
  { path: '/users', icon: '👥', label: 'Users' },
  { path: '/settings', icon: '⚙', label: 'Settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🛰</span>
          {!collapsed && <span className="logo-text">Traxlogi</span>}
        </div>
        <button className="toggle-btn" onClick={onToggle}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.fullName?.[0] || user?.username?.[0] || 'U'}</div>
          {!collapsed && (
            <div className="user-details">
              <span className="user-name">{user?.fullName || user?.username}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          )}
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          {collapsed ? '↪' : '↪ Logout'}
        </button>
      </div>
    </aside>
  );
}
