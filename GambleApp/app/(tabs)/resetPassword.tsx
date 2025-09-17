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
import {resetPassword} from "../../src/auth";
//Used figma to Create a design for the Sign Up Page

export default function TabTwoScreen() {
  const db = useSQLiteContext()
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    securityQuestion:'',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };
  {/* this function validates the form data by checking for errors in each field either by incorrect formatting or missing values */}
  const validateForm = () => {
    const next: Record<string, string> = {};
    if (!formData.password) next.password = 'Password is required';
    else if (formData.password.length < 8) next.password = 'At least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      next.password = 'Use upper, lower, and a number';
    }
    if (!formData.confirmPassword) next.confirmPassword = 'Confirm your password';
    else if (formData.confirmPassword !== formData.password)
      next.confirmPassword = 'Passwords do not match';

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
    const newUser = await resetPassword(db, {
      email: formData.email,
      password: formData.password,
      securityQuestion: formData.securityQuestion,
    });

    console.log("User inserted with id:", newUser.id);
    Alert.alert("Success", "Account created successfully!");
    router.push("/login");
  } catch (err: any) {
    if (err.code === "EMAIL_IN_USE") {
      Alert.alert("Error", "That email is already registered.");
    } else {
      console.error("Registration error:", err);
      Alert.alert("Error", "Registration failed. Please try again.");
    }
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
        <ThemedText type="title">Reset your password</ThemedText>
      </ThemedView>

      {/* Card-ish container */}
      <View style={styles.card}>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="you@example.com"
            value={formData.email}
            onChangeText={t => handleInputChange('email', t)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            style={[styles.input, errors.email && styles.inputError]}
          />
          {!!errors.email && <Text style={styles.error}>{errors.email}</Text>}
        </View>

        {/* Password */}
        <View style={styles.field}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              placeholder="Enter new password"
              value={formData.password}
              onChangeText={t => handleInputChange('password', t)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              style={[styles.inputFlex, errors.password && styles.inputError]}
            />
            <Pressable onPress={() => setShowPassword(p => !p)} hitSlop={10}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#666" />
            </Pressable>
          </View>

          {!!formData.password && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBg}>
                <View style={[styles.strengthFill, { width: `${pwStrength.pct}%` }]} />
              </View>
              <Text style={styles.strengthLabel}>{pwStrength.label}</Text>
            </View>
          )}
          {!!errors.password && <Text style={styles.error}>{errors.password}</Text>}
        </View>

        {/* Confirm password */}
        <View style={styles.field}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              placeholder="Re-enter new password"
              value={formData.confirmPassword}
              onChangeText={t => handleInputChange('confirmPassword', t)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              style={[styles.inputFlex, errors.confirmPassword && styles.inputError]}
            />
            <Pressable onPress={() => setShowConfirmPassword(p => !p)} hitSlop={10}>
              <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color="#666" />
            </Pressable>
          </View>

          {!!formData.confirmPassword && (
            <View style={styles.matchRow}>
              {formData.password === formData.confirmPassword ? (
                <>
                  <Feather name="check-circle" size={16} color="#16a34a" />
                  <Text style={styles.matchOk}>Passwords match</Text>
                </>
              ) : (
                <>
                  <Feather name="x-circle" size={16} color="#dc2626" />
                  <Text style={styles.matchBad}>Passwords don&apos;t match</Text>
                </>
              )}
            </View>
          )}
          {!!errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}
        </View>

        {/* Security Question */}
        <View style={styles.field}>
            <Text style={styles.label}>Security Question</Text>
            <Text>What is your favorite animal?</Text>
            <TextInput
                placeholder="Ex: Golden Retriever"
                value={formData.securityQuestion}
                onChangeText={t => handleInputChange('securityQuestion', t)}
                keyboardType="default"
                autoCapitalize="words"
                textContentType="none"
                style={[styles.input, errors.securityQuestion && styles.inputError]}
                />
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
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </Pressable>

        <Text style={styles.footerText}>
          <Text style={styles.link} onPress={() => router.push("/login")}>
            Back To Login
          </Text>
        </Text>
        <Text style={styles.footerText}>
            Don't have an account?{' '}
          <Text style={styles.link} onPress={() => router.push("/explore")}>
            Register Here           
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