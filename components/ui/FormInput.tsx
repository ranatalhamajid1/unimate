/**
 * Accessible, theme-aware FormInput component with error display and password toggling.
 */

import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { AppText } from "@/components/ui/AppText";
import { BorderRadius, Layout } from "@/constants/layout";
import { FontSize } from "@/constants/typography";

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function FormInput({
  label,
  error,
  containerStyle,
  isPassword = false,
  secureTextEntry,
  ...rest
}: FormInputProps) {
  const { colors } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const shouldHideText = isPassword ? !isPasswordVisible : secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      <AppText variant="caption" colorRole="secondary" style={styles.label}>
        {label}
      </AppText>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error
              ? colors.destructive
              : isFocused
              ? colors.accent
              : colors.border,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={shouldHideText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            activeOpacity={0.7}
            onPress={() => setIsPasswordVisible((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {Boolean(error) && (
        <AppText variant="caption" colorRole="destructive" style={styles.errorText}>
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: Layout.minTouchTarget,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    paddingVertical: 10,
  },
  eyeIcon: {
    padding: 6,
    marginLeft: 6,
  },
  errorText: {
    marginTop: 4,
  },
});
