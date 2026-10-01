'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { apiGet, apiPost, unwrap } from '@/lib/api';
import type { AuthUser } from '@/types';

interface Session {
  user: AuthUser | null;
  isLoading: boolean;
}

interface SessionContextValue extends Session {
  login: (user: AuthUser) => void;
  logout: () => void;
  refreshUser: (user: AuthUser) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({
    user: null,
    isLoading: true,
  });

  const login = useCallback((user: AuthUser) => {
    setSession({ user, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    void apiPost('/auth/logout').catch(() => {});
    setSession({ user: null, isLoading: false });
  }, []);

  const refreshUser = useCallback((user: AuthUser) => {
    setSession((prev) => ({ ...prev, user }));
  }, []);

  useEffect(() => {
    let active = true;
    apiGet<unknown>('/auth/me')
      .then((response) => {
        if (active) setSession({ user: unwrap<AuthUser>(response), isLoading: false });
      })
      .catch(() => {
        if (active) setSession({ user: null, isLoading: false });
      });
    return () => { active = false; };
  }, []);

  return (
    <SessionContext.Provider
      value={{
        ...session,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
