import { api } from './client';

export function login(username: string, password: string) {
  return api.post<{ id: number; username: string }>('/api/auth/login', { username, password });
}

export function logout() {
  return api.post<{ ok: boolean }>('/api/auth/logout', {});
}

export function getMe() {
  return api.get<{ id: number; username: string }>('/api/auth/me');
}

export function changePassword(currentPassword: string, newPassword: string) {
  return api.patch<{ ok: boolean }>('/api/auth/password', { currentPassword, newPassword });
}
