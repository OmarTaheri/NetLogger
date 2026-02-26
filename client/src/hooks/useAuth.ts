import { useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth';

interface Admin {
  id: number;
  username: string;
}

export function useAuth() {
  const [user, setUser] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const admin = await authApi.login(username, password);
    setUser(admin);
    return admin;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}
