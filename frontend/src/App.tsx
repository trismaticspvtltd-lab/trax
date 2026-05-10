import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import LiveMap from './pages/LiveMap/LiveMap';
import Devices from './pages/Devices/Devices';
import Trips from './pages/Trips/Trips';
import Alerts from './pages/Alerts/Alerts';
import Geofencing from './pages/Geofencing/Geofencing';
import Reports from './pages/Reports/Reports';
import Users from './pages/Users/Users';
import Drivers from './pages/Drivers/Drivers';
import Settings from './pages/Settings/Settings';
import LiveStream from './pages/LiveStream/LiveStream';
import Recordings from './pages/Recordings/Recordings';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="app-loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="app-loading">Loading...</div>;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="map" element={<LiveMap />} />
        <Route path="devices" element={<Devices />} />
        <Route path="trips" element={<Trips />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="geofencing" element={<Geofencing />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="settings" element={<Settings />} />
        <Route path="livestream" element={<LiveStream />} />
        <Route path="recordings" element={<Recordings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          theme="colored"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
