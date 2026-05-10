# Traxlogi GPS Fleet Management System

A production-ready GPS vehicle tracking platform with JT/T 808-2011 and JT/T 1078-2016 protocol support.

## Prerequisites
- Node.js 18+
- MySQL 8.0+
- ngrok (for TCP testing)

## Quick Start

### 1. Database Setup
```sql
CREATE DATABASE traxlogi;
```
Update `backend/.env` with your MySQL credentials.

### 2. Start Development
```powershell
cd fullstack-app
.\start-dev.ps1
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **JT808 TCP**: port 8808
- **Default Login**: admin / admin123

---

## ngrok Setup (For Real Device Testing)

### 1. Install ngrok
Download from https://ngrok.com/download

### 2. Expose TCP Port
```bash
ngrok tcp 8808
```

### 3. Get the ngrok URL
Output looks like: `tcp://0.tcp.ngrok.io:12345`

### 4. Update Device Config
Configure your GPS device (e.g., T98) with:
- Server: `0.tcp.ngrok.io`
- Port: `12345`
- Protocol: JT/T 808-2011

### 5. Update .env
```env
NGROK_TCP_URL=tcp://0.tcp.ngrok.io:12345
```

### 6. Test with Simulator
```bash
cd backend
NGROK_HOST=0.tcp.ngrok.io NGROK_PORT=12345 npx ts-node src/tcp-server/device-simulator.ts
```

---

## Architecture

```
frontend (React + Leaflet)    
    │── Socket.IO ──────────────┐
    └── REST API ─────────────┐ │
                              ▼ ▼
              backend (NestJS) :3001
              ├── REST API   (/api/*)
              ├── WebSocket  (/tracking)
              ├── TCP Server (:8808) ← GPS Devices (JT808)
              └── MySQL Database
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/devices | List all devices |
| GET | /api/devices/stats | Device statistics |
| GET | /api/tracking/:id/history | Track history |
| GET | /api/alerts | All alerts |
| GET | /api/trips | Trip list |
| GET | /api/geofences | Geofences |
| GET | /api/reports/mileage | Mileage report |
| GET | /api/reports/fleet | Fleet summary |

## Features
- ✅ Live GPS tracking on map (Leaflet)
- ✅ JT/T 808-2011 TCP protocol parser
- ✅ JT/T 1078-2016 video protocol support
- ✅ Real-time WebSocket updates
- ✅ Alert management (SOS, speeding, geofence, ADAS)
- ✅ Trip history with route replay
- ✅ Geofencing (circle, polygon) with entry/exit alerts
- ✅ Reports (mileage, speed, trips, fleet)
- ✅ Driver management
- ✅ User management with roles
- ✅ Device management
- ✅ ngrok TCP tunnel support for testing
