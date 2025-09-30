import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User } from './db';
import { useSQLiteContext } from 'expo-sqlite';

import { restoreSession, createSession as doCreateSession, logout as sessionLogout } from './session';
import { getUserCredits } from './db';
type SessionState = {
  user: User | null;
  credits: number;
  refreshCredits: () => Promise<void>;
  loading: boolean;
  setAuthenticatedUser: (userId: number) => Promise<void>; // call after your existing login succeeds
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const Ctx = createContext<SessionState | undefined>(undefined);

export const SessionProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const db = useSQLiteContext();
 const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    (async () => {
      const { user } = await restoreSession(db);
      setUser(user);
      if (user?.id) {
        const value = await getUserCredits(db, user.id);
        setCredits(value);
      }
      setLoading(false);
    })();
  }, []);
const refreshCredits = async () => {
    if (user?.id) {
      const value = await getUserCredits(db, user.id);
      setCredits(value);
    }
  };
  const setAuthenticatedUser = async (userId: number) => {
    await doCreateSession(db, userId);
    const { user } = await restoreSession(db);
    setUser(user);
      if (user?.id) {
    const value = await getUserCredits(db, user.id);
    setCredits(value);   
  }
  };

  const logout = async () => {
    await sessionLogout(db);
    setUser(null);
    setCredits(0);
  };

   const value = useMemo(
    () => ({
      user,
      credits,
      refreshCredits,
      loading,
      setAuthenticatedUser,
      logout,
      isAuthenticated: !!user,
    }),
    [user, credits, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession must be used within SessionProvider');
  return v;
}
