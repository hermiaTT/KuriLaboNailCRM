import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  ApiError,
  ApiUser,
  AuthResponse,
  authenticate,
  api,
  logoutMobileSession,
  refreshMobileSession,
} from '../lib/api';
import { UserRole } from '../types/models';

interface Profile {
  id: string;
  name: string;
  phone?: string;
  role: UserRole;
}

interface MobileSession extends AuthResponse {
  user: ApiUser;
}

interface RegisterInput {
  email?: string;
  password: string;
  name: string;
  phone: string;
  birthday?: string;
}

interface AuthContextType {
  session: MobileSession | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (phone: string, password: string) => Promise<{ error: string | null }>;
  signUp: (input: RegisterInput) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toProfile(user: ApiUser): Profile {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone ?? undefined,
    role: user.role === 'ADMIN' ? 'admin' : 'user',
  };
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) return 'Unable to reach Kuri Labo. Check your internet connection.';
  return 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((nextSession: MobileSession | null) => {
    setSession(nextSession);
    setProfile(nextSession ? toProfile(nextSession.user) : null);
  }, []);

  useEffect(() => {
    refreshMobileSession()
      .then(applySession)
      .finally(() => setLoading(false));
  }, [applySession]);

  const signIn = useCallback(async (phone: string, password: string) => {
    try {
      applySession(await authenticate('/api/v1/auth/login', { phone, password }));
      return { error: null };
    } catch (error) {
      return { error: errorMessage(error) };
    }
  }, [applySession]);

  const signUp = useCallback(async (input: RegisterInput) => {
    try {
      applySession(await authenticate('/api/v1/auth/register', {
        ...input,
        email: input.email?.trim() || null,
        birthday: input.birthday || null,
      }));
      return { error: null };
    } catch (error) {
      return { error: errorMessage(error) };
    }
  }, [applySession]);

  const signOut = useCallback(async () => {
    try {
      await logoutMobileSession();
    } finally {
      applySession(null);
    }
  }, [applySession]);

  const refreshUser = useCallback(async () => {
    const user = await api<ApiUser>('/api/v1/users/me');
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, user };
      setProfile(toProfile(user));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ session, profile, loading, signIn, signUp, signOut, refreshUser }),
    [session, profile, loading, signIn, signUp, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
