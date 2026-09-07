import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, clearToken, getToken, setToken } from './api';
import type { LoginResponse, UserInfo } from './types';

interface AuthContextValue {
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  can: (permission: string) => boolean;
  isRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [loading, setLoading] = useState<boolean>(!!getToken());

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const info = await api<UserInfo>('/auth/me');
      setUser(info);
    } catch {
      clearToken();
      setTokenState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string, remember = true) => {
    const res = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(res.accessToken, remember);
    setTokenState(res.accessToken);
    setUser(res.user);
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api<{ message: string }>('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const can = useCallback(
    (permission: string) => (user?.permissions ?? []).includes(permission),
    [user],
  );

  const isRole = useCallback(
    (role: string) => user?.roleName === role,
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, logout, refresh, can, isRole }),
    [user, token, loading, login, logout, refresh, can, isRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}