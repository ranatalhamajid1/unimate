/**
 * UniMate Mobile Signup Screen.
 * Connects directly to backend POST /api/mobile/auth/signup.
 */

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { AppText } from "@/components/ui/AppText";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { BorderRadius } from "@/constants/layout";

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const { colors } = useTheme();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      errors.password = "Password must contain both letters and numbers.";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async () => {
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await signup(name.trim(), email.trim(), password);
      if (!res.success) {
        if (res.errors) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.errors)) {
            mapped[k] = Array.isArray(v) ? v[0] : String(v);
          }
          setFieldErrors(mapped);
        }
        setGeneralError(res.error || "Failed to create account.");
      } else {
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      setGeneralError(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={[styles.logoContainer, { backgroundColor: colors.accentSubtle }]}>
          <Ionicons name="sparkles" size={30} color={colors.accent} />
        </View>
        <AppText variant="h1" align="center" style={styles.brandTitle}>
          Create account
        </AppText>
        <AppText colorRole="secondary" variant="subtitle" align="center" style={styles.brandSubtitle}>
          Start organizing your university life with UniMate
        </AppText>
      </View>

      {/* General Error Alert Banner */}
      {Boolean(generalError) && (
        <View style={[styles.errorBanner, { backgroundColor: colors.destructiveSubtle, borderColor: colors.destructive }]}>
          <Ionicons name="alert-circle" size={18} color={colors.destructive} style={styles.errorIcon} />
          <AppText variant="caption" colorRole="destructive" style={styles.errorText}>
            {generalError}
          </AppText>
        </View>
      )}

      {/* Form Fields */}
      <View style={styles.form}>
        <FormInput
          label="Full Name"
          placeholder="Alex Johnson"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
          }}
          error={fieldErrors.name}
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
        />

        <FormInput
          label="Email address"
          placeholder="student@university.edu"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
          }}
          error={fieldErrors.email}
          keyboardType="email-address"
          autoComplete="email"
          returnKeyType="next"
        />

        <FormInput
          label="Password (min. 8 chars, 1 letter, 1 number)"
          placeholder="••••••••"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
          }}
          error={fieldErrors.password}
          isPassword
          returnKeyType="next"
        />

        <FormInput
          label="Confirm Password"
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
          }}
          error={fieldErrors.confirmPassword}
          isPassword
          returnKeyType="done"
          onSubmitEditing={handleSignup}
        />

        <Button
          title="Create Account"
          onPress={handleSignup}
          isLoading={isLoading}
          size="lg"
          style={styles.submitButton}
        />
      </View>

      {/* Footer link to Login */}
      <View style={styles.footer}>
        <AppText colorRole="secondary" variant="body">
          Already have an account?{" "}
        </AppText>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          accessibilityRole="button"
          accessibilityLabel="Go to log in"
        >
          <AppText colorRole="accent" variant="bodyMedium">
            Log in
          </AppText>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  brandTitle: {
    marginBottom: 6,
  },
  brandSubtitle: {
    maxWidth: 300,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontWeight: "500",
  },
  form: {
    width: "100%",
  },
  submitButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
});
