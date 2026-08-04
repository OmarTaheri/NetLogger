import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';

interface AuthContextValue {
  user: authApi.User | null;
  config: authApi.AuthConfig;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<authApi.User>;
  googleSignIn: (credential: string) => Promise<authApi.User>;
  linkGoogle: (credential: string) => Promise<authApi.User>;
  completeOnboarding: (displayName: string, username?: string) => Promise<authApi.User>;
  logout: () => Promise<void>;
}

const fallbackConfig: authApi.AuthConfig = { googleEnabled: false, googleClientId: null, demoAccounts: [] };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<authApi.User | null>(null);
  const [config, setConfig] = useState(fallbackConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([authApi.getMe(), authApi.getAuthConfig()]).then(([me, authConfig]) => {
      setUser(me.status === 'fulfilled' ? me.value : null);
      if (authConfig.status === 'fulfilled') setConfig(authConfig.value);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const nextUser = await authApi.login(identifier, password);
    setUser(nextUser);
    return nextUser;
  }, []);

  const googleSignIn = useCallback(async (credential: string) => {
    const nextUser = await authApi.googleSignIn(credential);
    setUser(nextUser);
    return nextUser;
  }, []);

  const linkGoogle = useCallback(async (credential: string) => {
    const nextUser = await authApi.linkGoogle(credential);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // Leave the protected interface even if a transient network failure prevents
      // the server from clearing the cookie. The next request will re-check it.
      setUser(null);
    }
  }, []);

  const completeOnboarding = useCallback(async (displayName: string, username?: string) => {
    const nextUser = await authApi.completeOnboarding(displayName, username);
    setUser(nextUser);
    return nextUser;
  }, []);

  const value = useMemo(() => ({ user, config, loading, login, googleSignIn, linkGoogle, completeOnboarding, logout }),
    [user, config, loading, login, googleSignIn, linkGoogle, completeOnboarding, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
