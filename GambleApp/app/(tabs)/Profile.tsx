import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSQLiteContext } from "expo-sqlite";
import { verifyLogin } from "../../src/auth";
//Used figma to Create a design for the Log In Page
export default function TabTwoScreen() {
  const db = useSQLiteContext();

  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };
  {/* this function validates the form data by checking for errors in each field either by incorrect formatting or missing values */}
  const validateForm = () => {
    const next: Record<string, string> = {};
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) next.email = 'Email is required';
    else if (!emailRx.test(formData.email)) next.email = 'Enter a valid email';
    if (!formData.password) next.password = 'Password is required';
    else if (formData.password.length < 8) next.password = 'At least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      next.password = 'Use upper, lower, and a number';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  {/* this function calculates the strength of the password based on various criteria */}
  const getPasswordStrength = (password: string) => {
    if (!password) return { pct: 0, label: '' };
    let s = 0;
    if (password.length >= 8) s++;
    if (/[a-z]/.test(password)) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^a-zA-Z0-9]/.test(password)) s++;
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return { pct: (s / 5) * 100, label: labels[s - 1] || '' };
  };
  const pwStrength = getPasswordStrength(formData.password);


  {/* this function handles the form submission and communicates with the backend */}
  const handleSubmit = async () => {
  if (!validateForm()) return;
  setIsSubmitting(true);

  try {
    const result = await verifyLogin(db, formData.email, formData.password);

    if (!result.ok) {
      if (result.reason === "not_found" || result.reason === "bad_credentials") {
        Alert.alert("Login failed", "Invalid email or password.");
      }
      return;
    }

    // At this point, login success 🎉
    console.log("User logged in with ID:", result.userId);
    Alert.alert("Welcome back!", "Login successful");
    router.replace("/"); // Navigate to home
  } catch (err) {
    console.error("Login error:", err);
    Alert.alert("Error", "Could not sign in. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#f0f0f0', dark: '#303030' }}
      headerImage={
        <Image
          source={require('../../assets/images/stadium.webp')}
          style={[styles.headerImage, { width: 500, height: 300 }]}
          contentFit="cover"
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Hello, </ThemedText>
      </ThemedView>

      {/* Card-ish container */}
      <View style={styles.card}>
        

        {/* Email display */}
        <View style={styles.field}>
          <Text style={styles.label}>Email: </Text>
         
          {!!errors.email && <Text style={styles.error}>{errors.email}</Text>}
        </View>

        {/* Password display */}
        <View style={styles.field}>
          <Text style={styles.label}>Password: </Text>

          {!!errors.password && <Text style={styles.error}>{errors.password}</Text>}
        </View>

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </Pressable>

        <Text style={styles.footerText}>
          Don't have an account?{' '}
          <Text style={styles.link} onPress={() => router.push("/explore")}>
            Register here
          </Text>
        </Text>
      </View>
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