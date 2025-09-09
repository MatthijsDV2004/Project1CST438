import { Image } from 'expo-image';
import { useRouter, Link } from 'expo-router';
import { Platform, StyleSheet, Button, Pressable, View} from 'react-native';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";

export default function HomeScreen() {
  const router = useRouter();

  const db = useSQLiteContext();

  useEffect(() => {
    (async () => {
      try {
        const v = await db.getFirstAsync<{ v: string }>("select sqlite_version() as v");
        const uv = await db.getFirstAsync<{ user_version: number }>("pragma user_version");
        const tables = await db.getAllAsync<{ name: string }>(
          "select name from sqlite_master where type='table' order by name"
        );
        console.log("SQLite version:", v?.v);
        console.log("Schema version (user_version):", uv?.user_version);
        console.log("Tables:", tables.map(t => t.name));
        // Expect: users, user_data  (and a few SQLite internals)
      } catch (e) {
        console.error("DB smoke test failed:", e);
      }
    })();
  }, [db]);
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
        source={require('../../assets/images/stadium.webp')}
        style={[styles.headerImage, { width: 500, height: 300 }]}
        contentFit="cover"
      />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to BetURLife!</ThemedText>
        <HelloWave />
      </ThemedView>
      
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Login or create your account!</ThemedText>
        <ThemedText>
          If you already have an account: enter your <ThemedText type="defaultSemiBold">username</ThemedText> and <ThemedText type="defaultSemiBold">password</ThemedText>. 
          If you do not have an account, press{' '}
          <ThemedText type="defaultSemiBold">
            'Create Account'
          </ThemedText>{' '}
          to register now.
        </ThemedText>
      </ThemedView>

      <Pressable onPress={() => router.push("/login")}>
        <ThemedView style={styles.button}>
          <ThemedText type="defaultSemiBold" style={{ color: "#ffffff" }}>
            Proceed to login
          </ThemedText>
        </ThemedView>
      </Pressable>

      <ThemedText>
        {`No account? Register Now!`}
      </ThemedText>
      <Pressable onPress={() => router.push("/explore")}>
        <ThemedText type="defaultSemiBold" style={{ color: "#6b6b6b", textDecorationLine: "underline" }}>
          Register here
        </ThemedText>
      </Pressable>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { alignSelf: 'center' },

  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  button: {
    marginTop: 14,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
