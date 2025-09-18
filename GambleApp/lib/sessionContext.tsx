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
      const { user } = await restoreSession();
      setUser(user);
      setLoading(false);
    })();
  }, []);

  const setAuthenticatedUser = async (userId: number) => {
    await doCreateSession(userId);
    try {
    const { user } = await restoreSession();
    setUser(user);
    } catch (e) {
      console.error("restoreSession failed:", e);
    } finally {
      setLoading(false);
  }
};

  const logout = async () => {
    await sessionLogout();  // clear db + SecureStore
    setUser(null);          // reset state so isAuthenticated = false
  };

  const value = useMemo(() => ({
    user, loading, setAuthenticatedUser, logout, isAuthenticated: !!user
  }), [user, loading]);

  return (
    <Ctx.Provider value={{ user, loading, setAuthenticatedUser, logout, isAuthenticated: !!user }}>
      {children}
    </Ctx.Provider>);
};

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession must be used within SessionProvider');
  return v;
}
