/**
 * UniMate Mobile Login Screen.
 * Connects directly to backend POST /api/mobile/auth/login.
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

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(trimmedEmail, password);
      if (!res.success) {
        setErrorMessage(res.error || "Invalid email or password.");
      } else {
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={[styles.logoContainer, { backgroundColor: colors.accentSubtle }]}>
          <Ionicons name="school" size={32} color={colors.accent} />
        </View>
        <AppText variant="h1" align="center" style={styles.brandTitle}>
          UniMate
        </AppText>
        <AppText colorRole="secondary" variant="subtitle" align="center" style={styles.brandSubtitle}>
          Log in to continue your academic journey
        </AppText>
      </View>

      {/* Error Alert Banner */}
      {Boolean(errorMessage) && (
        <View style={[styles.errorBanner, { backgroundColor: colors.destructiveSubtle, borderColor: colors.destructive }]}>
          <Ionicons name="alert-circle" size={18} color={colors.destructive} style={styles.errorIcon} />
          <AppText variant="caption" colorRole="destructive" style={styles.errorText}>
            {errorMessage}
          </AppText>
        </View>
      )}

      {/* Form Fields */}
      <View style={styles.form}>
        <FormInput
          label="Email address"
          placeholder="student@university.edu"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errorMessage) setErrorMessage(null);
          }}
          keyboardType="email-address"
          autoComplete="email"
          returnKeyType="next"
        />

        <FormInput
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errorMessage) setErrorMessage(null);
          }}
          isPassword
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <Button
          title="Sign In"
          onPress={handleLogin}
          isLoading={isLoading}
          size="lg"
          style={styles.submitButton}
        />
      </View>

      {/* Footer link to Signup */}
      <View style={styles.footer}>
        <AppText colorRole="secondary" variant="body">
          Don't have an account?{" "}
        </AppText>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/signup")}
          accessibilityRole="button"
          accessibilityLabel="Go to sign up"
        >
          <AppText colorRole="accent" variant="bodyMedium">
            Sign up
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
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  brandTitle: {
    marginBottom: 6,
  },
  brandSubtitle: {
    maxWidth: 280,
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
    marginTop: 32,
  },
});
