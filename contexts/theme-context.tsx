/**
 * Theme Context & Provider for UniMate Mobile.
 * Supports light, dark, and system modes with persistent user preference.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LightColors, DarkColors, ThemeColors } from "@/constants/colors";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
  themePreference: ThemePreference;
  isDark: boolean;
  colors: ThemeColors;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
}

const THEME_STORAGE_KEY = "unimate_theme_preference";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadStoredPreference() {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "light" || stored === "dark" || stored === "system") {
          setThemePreferenceState(stored);
        }
      } catch (e) {
        if (typeof __DEV__ !== "undefined" && __DEV__) {
          console.warn("Failed to load theme preference:", e);
        }
      } finally {
        setIsLoaded(true);
      }
    }
    loadStoredPreference();
  }, []);

  const setThemePreference = async (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch (e) {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.warn("Failed to save theme preference:", e);
      }
    }
  };

  const isDark =
    themePreference === "dark" ||
    (themePreference === "system" && systemColorScheme === "dark");

  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        isDark,
        colors,
        setThemePreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
