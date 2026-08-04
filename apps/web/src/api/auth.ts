import { api } from './client';

export interface User {
  id: number;
  username: string | null;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: 'user' | 'admin';
  onboardingCompleted: boolean;
  providers: Array<'password' | 'google'>;
}

export interface AuthConfig {
  googleEnabled: boolean;
  googleClientId: string | null;
  demoAccounts: DemoAccount[];
}

export interface DemoAccount {
  label: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export function getAuthConfig() {
  return api.get<AuthConfig>('/api/auth/config');
}

export function login(identifier: string, password: string) {
  return api.post<User>('/api/auth/login', { identifier, password });
}

export function googleSignIn(credential: string) {
  return api.post<User>('/api/auth/google', { credential });
}

export function linkGoogle(credential: string) {
  return api.post<User>('/api/auth/google/link', { credential });
}

export function logout() {
  return api.post<{ ok: boolean }>('/api/auth/logout', {});
}

export function getMe() {
  return api.get<User>('/api/auth/me');
}

export function completeOnboarding(displayName: string, username?: string) {
  return api.patch<User>('/api/auth/onboarding', { displayName, username });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return api.patch<{ ok: boolean }>('/api/auth/password', { currentPassword, newPassword });
}
