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
import { useSession } from '@/lib/sessionContext';
import { resetPasswordInSession} from '@/lib/session';
//Used figma to Create a design for the Sign Up Page

export default function TabTwoScreen() {
  const db = useSQLiteContext();
  const { user } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    securityQuestion: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // handle inputs
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // validation
  const validateForm = () => {
    const next: Record<string, string> = {};
    if (!formData.password) {
      next.password = "Password is required";
      console.log("Reset page user:", user);
    } else if (formData.password.length < 8) {
      next.password = "At least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      next.password = "Use upper, lower, and a number";
    }

    if (!formData.confirmPassword)
      next.confirmPassword = "Confirm your password";
    else if (formData.confirmPassword !== formData.password)
      next.confirmPassword = "Passwords do not match";

    if (!user && !formData.email) {
      next.email = "Email is required";
    }
    if (!user && !formData.securityQuestion) {
      next.securityQuestion = "Answer your security question";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      if (user) {
        // in-session flow
        await resetPasswordInSession(db, {
          userId: user.id,
          password: formData.password,
        });
        Alert.alert("Success", "Password changed successfully!");
        router.push("/profile");
      } else {
        // out-of-session flow
        await resetPassword(db, {
          email: formData.email,
          password: formData.password,
          securityQuestion: formData.securityQuestion,
        });
        Alert.alert("Success", "Password reset successfully!");
        router.push("/sign-in");
      }
    } catch (err: any) {
      if (err.code === "NO_USER") {
        Alert.alert("Error", "No account found with that email.");
      } else if (err.code === "SECURITY_MISMATCH") {
        Alert.alert("Error", "Security question answer is incorrect.");
      } else {
        console.error("Reset error:", err);
        Alert.alert("Error", "Password reset failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#f0f0f0", dark: "#303030" }}
      headerImage={
        <Image
          source={require("../../assets/images/stadium.webp")}
          style={[styles.headerImage, { width: 500, height: 300 }]}
          contentFit="cover"
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Reset your password</ThemedText>
      </ThemedView>

      <View style={styles.card}>
        {/* Email (only if out of session) */}
        {!user && (
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="you@example.com"
              value={formData.email}
              onChangeText={(t) => handleInputChange("email", t)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              style={[styles.input, errors.email && styles.inputError]}
            />
            {!!errors.email && <Text style={styles.error}>{errors.email}</Text>}
          </View>
        )}

        {/* Password */}
        <View style={styles.field}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              placeholder="Enter new password"
              value={formData.password}
              onChangeText={(t) => handleInputChange("password", t)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              style={[styles.inputFlex, errors.password && styles.inputError]}
            />
            <Pressable onPress={() => setShowPassword((p) => !p)} hitSlop={10}>
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color="#666"
              />
            </Pressable>
          </View>
          {!!errors.password && (
            <Text style={styles.error}>{errors.password}</Text>
          )}
        </View>

        {/* Confirm password */}
        <View style={styles.field}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              placeholder="Re-enter new password"
              value={formData.confirmPassword}
              onChangeText={(t) => handleInputChange("confirmPassword", t)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              style={[
                styles.inputFlex,
                errors.confirmPassword && styles.inputError,
              ]}
            />
            <Pressable
              onPress={() => setShowConfirmPassword((p) => !p)}
              hitSlop={10}
            >
              <Feather
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={18}
                color="#666"
              />
            </Pressable>
          </View>
          {!!errors.confirmPassword && (
            <Text style={styles.error}>{errors.confirmPassword}</Text>
          )}
        </View>

        {/* Security Question (only if out of session) */}
        {!user && (
          <View style={styles.field}>
            <Text style={styles.label}>Security Question</Text>
            <Text>What is your favorite animal?</Text>
            <TextInput
              placeholder="Ex: Golden Retriever"
              value={formData.securityQuestion}
              onChangeText={(t) => handleInputChange("securityQuestion", t)}
              keyboardType="default"
              autoCapitalize="words"
              textContentType="none"
              style={[
                styles.input,
                errors.securityQuestion && styles.inputError,
              ]}
            />
            {!!errors.securityQuestion && (
              <Text style={styles.error}>{errors.securityQuestion}</Text>
            )}
          </View>
        )}

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
        <Pressable
  style={styles.backButton}
  onPress={() => router.back()}
  accessibilityRole="button"
  accessibilityLabel="Go back"
>
  <Text style={styles.backButtonText}>Back</Text>
</Pressable>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { alignSelf: "center" },
  titleContainer: { flexDirection: "row", gap: 8, marginBottom: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  backButton: {
  marginTop: 12,
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 8,
  backgroundColor: "#e5e7eb", // light gray
  alignItems: "center",
},
backButtonText: {
  color: "#111827",
  fontWeight: "600",
  fontSize: 16,
},
  field: { flex: 1, marginBottom: 12 },
  label: { marginBottom: 6, fontWeight: "600", color: "#111827" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputFlex: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
    marginRight: 8,
  },
  inputWithIcon: { flexDirection: "row", alignItems: "center" },
  inputError: { borderColor: "#ef4444" },
  error: { color: "#dc2626", marginTop: 4, fontSize: 13 },
  button: {
    marginTop: 14,
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});