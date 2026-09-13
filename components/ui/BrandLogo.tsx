import React from "react";
import { View, Image, StyleSheet, StyleProp, ViewStyle, ImageStyle, TextStyle } from "react-native";
import { AppText } from "@/components/ui/AppText";

export type MobileBrandLogoVariant = "full" | "horizontal" | "icon" | "lockup";
export type MobileBrandLogoSize = "xs" | "sm" | "md" | "lg" | "xl";

interface BrandLogoProps {
  variant?: MobileBrandLogoVariant;
  size?: MobileBrandLogoSize;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
}

const BRAND_ASSETS = {
  icon: require("@/assets/brand/icon-mark-transparent.png"),
  horizontal: require("@/assets/brand/logo-horizontal-transparent.png"),
  full: require("@/assets/brand/logo-full-transparent.png"),
};

const SIZES = {
  icon: {
    xs: { width: 22, height: 22 },
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 },
  },
  lockup: {
    xs: { iconSize: 22, fontSize: 14, gap: 6 },
    sm: { iconSize: 28, fontSize: 16, gap: 8 },
    md: { iconSize: 34, fontSize: 18, gap: 10 },
    lg: { iconSize: 42, fontSize: 22, gap: 12 },
    xl: { iconSize: 52, fontSize: 26, gap: 14 },
  },
  horizontal: {
    xs: { width: 72, height: 24 },
    sm: { width: 88, height: 30 },
    md: { width: 110, height: 38 },
    lg: { width: 136, height: 46 },
    xl: { width: 168, height: 58 },
  },
  full: {
    xs: { width: 48, height: 48 },
    sm: { width: 64, height: 64 },
    md: { width: 96, height: 96 },
    lg: { width: 128, height: 128 },
    xl: { width: 160, height: 160 },
  },
};

export function BrandLogo({
  variant = "lockup",
  size = "sm",
  style,
  imageStyle,
  accessibilityLabel = "UniMate",
}: BrandLogoProps) {
  if (variant === "lockup") {
    const config = SIZES.lockup[size];
    return (
      <View
        style={[
          styles.lockupContainer,
          { gap: config.gap },
          style,
        ]}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      >
        <Image
          source={BRAND_ASSETS.icon}
          style={[
            {
              width: config.iconSize,
              height: config.iconSize,
              resizeMode: "contain",
            },
            imageStyle,
          ]}
        />
        <AppText
          variant="label"
          style={{
            fontSize: config.fontSize,
            fontWeight: "700",
            letterSpacing: -0.3,
          }}
        >
          UniMate
        </AppText>
      </View>
    );
  }

  const dims = SIZES[variant][size];
  const source = BRAND_ASSETS[variant];

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={[
          {
            width: dims.width,
            height: dims.height,
            resizeMode: "contain",
          },
          imageStyle,
        ]}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  lockupContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
