import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { initDb, User } from './db';
import { restoreSession, createSession as doCreateSession, logout as sessionLogout } from './session';

type SessionState = {
  user: User | null;
  loading: boolean;
  setAuthenticatedUser: (userId: number) => Promise<void>; // call after your existing login succeeds
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const Ctx = createContext<SessionState | undefined>(undefined);

export const SessionProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await initDb();
      const { user } = await restoreSession();
      setUser(user);
      setLoading(false);
    })();
  }, []);

  const setAuthenticatedUser = async (userId: number) => {
    await doCreateSession(userId);
    const { user } = await restoreSession();
    setUser(user);
  };

  const logout = async () => {
    await sessionLogout();   // clear SQLite + SecureStore
    setUser(null);           // reset React state
  };

  const value = useMemo(() => ({
    user, loading, setAuthenticatedUser, logout, isAuthenticated: !!user
  }), [user, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession must be used within SessionProvider');
  return v;
}
