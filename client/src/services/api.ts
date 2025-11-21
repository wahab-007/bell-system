import axios from 'axios';
import { useAuthStore } from '../state/useAuthStore';
import type { AuthUser, Organisation, Block, Bell, Schedule, EmergencyState, EventLog } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        const { data } = await api.post('/auth/refresh', { refreshToken });
        useAuthStore.setState({ accessToken: data.accessToken });
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      }
      useAuthStore.getState().clear();
    }
    return Promise.reject(error);
  },
);

export interface AuthResponse {
  user: AuthUser;
  organisation: Organisation;
  accessToken: string;
  refreshToken: string;
}

export const loginRequest = (payload: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', payload);
export const signupRequest = (payload: Record<string, unknown>) =>
  api.post<AuthResponse>('/auth/signup', payload);

export const updateBellRequest = (id: string, payload: Partial<{ label: string; deviceId: string; deviceSecret: string }>) =>
  api.put<Bell>(`/bells/${id}`, payload);
export const deleteBellRequest = (id: string) => api.delete(`/bells/${id}`);

export const fetchBlocks = () => api.get<Block[]>('/blocks');
export const createBlockRequest = (payload: { name: string; description?: string }) =>
  api.post<Block>('/blocks', payload);
export const deleteBlockRequest = (id: string) => api.delete(`/blocks/${id}`);

export const fetchBells = () => api.get<Bell[]>('/bells');
export const createBellRequest = (payload: { label: string; blockId: string; deviceId: string; deviceSecret: string }) =>
  api.post<Bell>('/bells', payload);

export const updateScheduleRequest = (
  id: string,
  payload: Partial<{
    name: string;
    bellIds: string[];
    time: string;
    durationSec: number;
    daysOfWeek: number[];
    active: boolean;
  }>,
) => api.put<Schedule>(`/schedules/${id}`, payload);
export const deleteScheduleRequest = (id: string) => api.delete(`/schedules/${id}`);

export const fetchSchedules = () => api.get<Schedule[]>('/schedules');
export const createScheduleRequest = (payload: Record<string, unknown>) =>
  api.post<Schedule>('/schedules', payload);

export const fetchEmergencyState = () => api.get<EmergencyState>('/emergency');
export const activateEmergencyRequest = () => api.post('/emergency/activate', {});
export const deactivateEmergencyRequest = () => api.post('/emergency/deactivate', {});
export const fetchProfileRequest = () => api.get('/profile');
export const updateProfileRequest = (payload: Partial<{ name: string; phone: string; password: string; email: string }>) =>
  api.put('/profile', payload);

// Admin endpoints
export const fetchAdminHealth = () => api.get('/admin/health');
export const fetchAdminLogs = (limit = 50) => api.get<EventLog[]>(`/admin/logs?limit=${limit}`);
export const fetchAdminUsers = () => api.get('/admin/users');
export const createAdminUser = (payload: { name: string; email: string; password: string; role: string; organisationId: string }) =>
  api.post('/admin/users', payload);
export const updateAdminUser = (id: string, payload: Partial<{ name: string; email: string; password: string; role: string }>) =>
  api.put(`/admin/users/${id}`, payload);
export const deleteAdminUser = (id: string) => api.delete(`/admin/users/${id}`);

export const fetchAdminBlocks = () => api.get('/admin/blocks');
export const createAdminBlock = (payload: { organisationId: string; name: string; description?: string }) =>
  api.post('/admin/blocks', payload);
export const updateAdminBlock = (id: string, payload: Partial<{ name: string; description?: string }>) =>
  api.put(`/admin/blocks/${id}`, payload);
export const deleteAdminBlock = (id: string) => api.delete(`/admin/blocks/${id}`);

export const fetchAdminBells = () => api.get('/admin/bells');
export const createAdminBell = (payload: {
  organisationId: string;
  blockId: string;
  label: string;
  deviceId: string;
  deviceSecret: string;
  capabilities?: string[];
}) => api.post('/admin/bells', payload);
export const updateAdminBell = (id: string, payload: Record<string, unknown>) => api.put(`/admin/bells/${id}`, payload);
export const deleteAdminBell = (id: string) => api.delete(`/admin/bells/${id}`);

export const fetchAdminSchedules = () => api.get('/admin/schedules');
export const createAdminSchedule = (payload: {
  organisationId: string;
  name: string;
  time: string;
  durationSec: number;
  bellIds: string[];
  daysOfWeek?: number[];
  active?: boolean;
}) => api.post('/admin/schedules', payload);
export const updateAdminSchedule = (id: string, payload: Record<string, unknown>) => api.put(`/admin/schedules/${id}`, payload);
export const deleteAdminSchedule = (id: string) => api.delete(`/admin/schedules/${id}`);
export const fetchAdminOrganisations = () => api.get('/admin/organisations');
export const createAdminOrganisation = (payload: { name: string; contactEmail: string; contactPhone?: string; timezone?: string }) =>
  api.post('/admin/organisations', payload);
export const updateAdminOrganisation = (id: string, payload: Record<string, unknown>) =>
  api.put(`/admin/organisations/${id}`, payload);
export const deleteAdminOrganisation = (id: string) => api.delete(`/admin/organisations/${id}`);
