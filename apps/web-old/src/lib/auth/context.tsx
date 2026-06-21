'use client';

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/lib/types';
import { authApi } from '@/lib/api/auth';
import { setTokens, clearTokens, getAccessToken } from '@/lib/api/client';
import { adaptUserProfile } from '@/lib/api/adapters';

// ─── Types ──────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (phone: string, code: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// ─── Context ────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ───────────────────────────────────────

export function AuthProvider({ children, locale = 'ar' }: { children: ReactNode; locale?: string }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing session on mount
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    authApi
      .me()
      .then((res) => {
        setState({
          user: adaptUserProfile(res.data, locale),
          isAuthenticated: true,
          isLoading: false,
        });
      })
      .catch(() => {
        clearTokens();
        setState({ user: null, isAuthenticated: false, isLoading: false });
      });
  }, [locale]);

  const login = useCallback(
    async (phone: string, code: string) => {
      const res = await authApi.verifyOtp(phone, code);
      setTokens(res.data.accessToken, res.data.refreshToken);
      setState({
        user: adaptUserProfile(res.data.user, locale),
        isAuthenticated: true,
        isLoading: false,
      });
    },
    [locale],
  );

  const logout = useCallback(() => {
    clearTokens();
    setState({ user: null, isAuthenticated: false, isLoading: false });
    if (typeof window !== 'undefined') {
      window.location.href = `/${locale}/onboarding/phone`;
    }
  }, [locale]);

  const updateUser = useCallback((user: User) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
