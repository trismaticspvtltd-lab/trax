import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSocket } from '../../hooks/useSocket';
import './Layout.css';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/map': 'Live Map',
  '/devices': 'Devices',
  '/trips': 'Trip History',
  '/alerts': 'Alerts',
  '/geofencing': 'Geofencing',
  '/reports': 'Reports',
  '/drivers': 'Drivers',
  '/users': 'Users',
  '/settings': 'Settings',
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { connected } = useSocket();
  const title = pageTitles[location.pathname] || 'Traxlogi';

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="main-content">
        <Header title={title} connected={connected} />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
