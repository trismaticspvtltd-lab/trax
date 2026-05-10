import React, { useEffect, useState } from 'react';
import { alertsApi } from '../../api';
import './Header.css';

interface HeaderProps {
  title: string;
  connected: boolean;
}

export default function Header({ title, connected }: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    alertsApi.getUnreadCount().then((r) => setUnreadCount(r.data)).catch(() => {});
    const interval = setInterval(() => {
      alertsApi.getUnreadCount().then((r) => setUnreadCount(r.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="app-header">
      <h1 className="page-title">{title}</h1>
      <div className="header-right">
        <div className={`connection-badge ${connected ? 'connected' : 'disconnected'}`}>
          <span className="connection-dot"></span>
          {connected ? 'Live' : 'Offline'}
        </div>
        {unreadCount > 0 && (
          <div className="alert-badge">
            🔔 <span>{unreadCount}</span>
          </div>
        )}
        <div className="header-time">{new Date().toLocaleDateString()}</div>
      </div>
    </header>
  );
}
