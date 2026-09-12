import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from "react-native";

import { getInitials, getAvatarColor } from "@/lib/avatar-utils";

export { getInitials, getAvatarColor };

interface AvatarFallbackProps {
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function AvatarFallback({
  name,
  size = "md",
  style,
  textStyle,
}: AvatarFallbackProps) {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  const dimension =
    typeof size === "number"
      ? size
      : {
          sm: 32,
          md: 44,
          lg: 64,
          xl: 88,
        }[size];

  const fontSize =
    typeof size === "number"
      ? Math.round(size * 0.4)
      : {
          sm: 13,
          md: 17,
          lg: 24,
          xl: 34,
        }[size];

  const borderRadius = Math.round(dimension / 2);

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius,
          backgroundColor: bgColor,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={`${name || "User"}'s avatar`}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize,
            lineHeight: fontSize * 1.2,
          },
          textStyle,
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
  },
});
