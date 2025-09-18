import 'react-native-get-random-values';
import { registerRootComponent } from 'expo';
import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { SessionProvider, useSession } from '../lib/sessionContext';
import { ActivityIndicator, View } from 'react-native';
import { SQLiteProvider } from "expo-sqlite";
import { initDb } from "../lib/db";


function AuthGate({ children }: React.PropsWithChildren) {
  const { isAuthenticated, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('../(auth)/sign-in');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('../(tabs)/index');
    }
  }, [loading, isAuthenticated, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="app.db" onInit={initDb}>
      <SessionProvider>
      <AuthGate>
        <Slot />
      </AuthGate>
    </SessionProvider>
    </SQLiteProvider>
    
  );
}
