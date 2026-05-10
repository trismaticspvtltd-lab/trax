import api from './axios';

export const authApi = {
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data: any) => api.put('/auth/change-password', data),
};

export const devicesApi = {
  getAll: (params?: any) => api.get('/devices', { params }),
  getOne: (id: number) => api.get(`/devices/${id}`),
  create: (data: any) => api.post('/devices', data),
  update: (id: number, data: any) => api.put(`/devices/${id}`, data),
  delete: (id: number) => api.delete(`/devices/${id}`),
  getStats: () => api.get('/devices/stats'),
};

export const trackingApi = {
  getHistory: (deviceId: number, start: string, end: string) =>
    api.get(`/tracking/${deviceId}/history`, { params: { start, end } }),
  getLatest: (deviceId: number) => api.get(`/tracking/${deviceId}/latest`),
  getMileage: (deviceId: number, date?: string) =>
    api.get(`/tracking/${deviceId}/mileage`, { params: { date } }),
};

export const alertsApi = {
  getAll: (params?: any) => api.get('/alerts', { params }),
  getStats: () => api.get('/alerts/stats'),
  getUnreadCount: () => api.get('/alerts/unread-count'),
  markAsRead: (id: number) => api.put(`/alerts/${id}/read`),
  markAllAsRead: (deviceId?: number) => api.put('/alerts/mark-all-read', undefined, { params: { deviceId } }),
  resolve: (id: number) => api.put(`/alerts/${id}/resolve`),
};

export const tripsApi = {
  getAll: (params?: any) => api.get('/trips', { params }),
  getOne: (id: number) => api.get(`/trips/${id}`),
  getStats: (deviceId?: number) => api.get('/trips/stats', { params: { deviceId } }),
};

export const geofencesApi = {
  getAll: (params?: any) => api.get('/geofences', { params }),
  getOne: (id: number) => api.get(`/geofences/${id}`),
  create: (data: any) => api.post('/geofences', data),
  update: (id: number, data: any) => api.put(`/geofences/${id}`, data),
  delete: (id: number) => api.delete(`/geofences/${id}`),
};

export const reportsApi = {
  getMileage: (deviceId: number, start: string, end: string) =>
    api.get('/reports/mileage', { params: { deviceId, start, end } }),
  getSpeed: (deviceId: number, start: string, end: string) =>
    api.get('/reports/speed', { params: { deviceId, start, end } }),
  getAlerts: (deviceId: number, start: string, end: string) =>
    api.get('/reports/alerts', { params: { deviceId, start, end } }),
  getTrips: (deviceId: number, start: string, end: string) =>
    api.get('/reports/trips', { params: { deviceId, start, end } }),
  getFleet: (start: string, end: string) =>
    api.get('/reports/fleet', { params: { start, end } }),
};

export const usersApi = {
  getAll: () => api.get('/users'),
  getOne: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
};

export const driversApi = {
  getAll: () => api.get('/drivers'),
  getOne: (id: number) => api.get(`/drivers/${id}`),
  create: (data: any) => api.post('/drivers', data),
  update: (id: number, data: any) => api.put(`/drivers/${id}`, data),
  delete: (id: number) => api.delete(`/drivers/${id}`),
};

export const deviceCommandsApi = {
  vehicleControl: (imei: string, data: any) => api.post(`/devices/${imei}/control/vehicle`, data),
  queryLocation: (imei: string) => api.post(`/devices/${imei}/control/query-location`),
  tempTracking: (imei: string, data: any) => api.post(`/devices/${imei}/control/temp-tracking`, data),
  setParams: (imei: string, data: any) => api.post(`/devices/${imei}/control/set-params`, data),
  queryParams: (imei: string, data: any) => api.post(`/devices/${imei}/control/query-params`, data),
  sendText: (imei: string, data: any) => api.post(`/devices/${imei}/control/text`, data),
  terminalControl: (imei: string, data: any) => api.post(`/devices/${imei}/control/terminal`, data),
  takePhoto: (imei: string, data: any) => api.post(`/devices/${imei}/control/photo`, data),
  requestVideo: (imei: string, data: any) => api.post(`/devices/${imei}/control/video`, data),
  videoControl: (imei: string, data: any) => api.post(`/devices/${imei}/control/video-ctrl`, data),
  videoPlayback: (imei: string, data: any) => api.post(`/devices/${imei}/control/video-playback`, data),
  queryFiles: (imei: string, data: any) => api.post(`/devices/${imei}/control/query-files`, data),
  uploadFiles: (imei: string, data: any) => api.post(`/devices/${imei}/control/upload-files`, data),
  ptzControl: (imei: string, data: any) => api.post(`/devices/${imei}/control/ptz`, data),
};

export const recordingsApi = {
  getAll: (params?: any) => api.get('/recordings', { params }),
  getOne: (id: number) => api.get(`/recordings/${id}`),
  remove: (id: number) => api.delete(`/recordings/${id}`),
};

export const mediaApi = {
  getActiveStreams: () => api.get('/media/streams'),
  stopStream: (imei: string) => api.delete(`/media/streams/${imei}`),
};
