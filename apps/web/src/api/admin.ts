import { api } from './client';

export interface AdminOverview {
  totalUsers: number;
  standardUsers: number;
  totalLinks: number;
  activeLinks: number;
  totalVisitors: number;
}

export interface AdminUser {
  id: number;
  displayName: string;
  email: string | null;
  username: string | null;
  role: 'user' | 'admin';
  providers: Array<'password' | 'google'>;
  createdAt: string;
  linkCount: number;
  visitorCount: number;
  lastActivityAt: string | null;
}

export function getAdminOverview() {
  return api.get<AdminOverview>('/api/admin/overview');
}

export function getAdminUsers() {
  return api.get<AdminUser[]>('/api/admin/users');
}
