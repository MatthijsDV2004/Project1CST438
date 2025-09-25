import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from 'react-native';
import { useSession } from '../../lib/sessionContext';
import { useRouter, Link } from 'expo-router';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSQLiteContext } from "expo-sqlite";


export default function TabTwoScreen() {
  const { logout, user } = useSession();
  const db = useSQLiteContext();

  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#f0f0f0', dark: '#303030' }}
      headerImage={
        <Image
          source={require('../../assets/images/settings.webp')}
          style={[styles.headerImage, { width: 500, height: 300 }]}
          contentFit="cover"
        />
      }
    >
    <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Settings </ThemedText>
    </ThemedView>

    {/* Card-ish container */}
    <View style={styles.card}>
        {/* name display */}
        <View style={styles.field}>
        <Button title="Log out" onPress={logout} />       
        </View>

        {/* email display */}
        <View style={styles.field}>
        <Text style={styles.label}>Email: {user?.email} </Text>         
        </View>

        <Text>
            Forgot your password?{' '}
            <Text style={styles.link} onPress={() => router.push("/settingPassReset")}>
                Reset Password Here           
            </Text>
        </Text>
    </View>

    <Pressable onPress={() => router.push("/Profile")}>
        <ThemedView style={styles.button}>
          <ThemedText type="defaultSemiBold" style={{ color: "#ffffff" }}>
            Back to Profile
          </ThemedText>
        </ThemedView>
    </Pressable>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { alignSelf: 'center' },

  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },

  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, marginBottom: 12 },

  label: { marginBottom: 6, fontWeight: '600', color: '#111827' },

  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputFlex: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center' },
  inputError: { borderColor: '#ef4444' },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  strengthBg: { flex: 1, height: 8, borderRadius: 999, backgroundColor: '#e5e7eb' },
  strengthFill: { height: 8, borderRadius: 999, backgroundColor: '#22c55e' },
  strengthLabel: { fontSize: 12, color: '#4b5563' },

  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  matchOk: { color: '#16a34a', fontSize: 13 },
  matchBad: { color: '#dc2626', fontSize: 13 },
  error: { color: '#dc2626', marginTop: 4, fontSize: 13 },

  notice: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 4,
  },
  noticeText: { color: '#374151', fontSize: 13 },

  button: {
    marginTop: 14,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  footerText: { textAlign: 'center', color: '#6b7280', marginTop: 12 },
  link: { color: '#4f46e5', fontWeight: '600' },
});