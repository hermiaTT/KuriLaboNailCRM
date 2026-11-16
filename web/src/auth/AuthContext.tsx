import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, setAccessToken } from '../lib/api';
import type { AuthResponse, UserSummary } from '../types';

type AuthContextValue = {
  user: UserSummary | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone: string | null;
  birthday: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<UserSummary>('/api/v1/users/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await api<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        clientType: 'WEB',
        deviceName: 'Kuri Labo Web',
      }),
    });
    setAccessToken(session.accessToken);
    setUser(session.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const session = await api<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        clientType: 'WEB',
        deviceName: 'Kuri Labo Web',
      }),
    });
    setAccessToken(session.accessToken);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api<void>('/api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ clientType: 'WEB' }),
      });
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
