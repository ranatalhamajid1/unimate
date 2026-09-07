/**
 * Global Configuration for UniMate Mobile.
 * Derives API Base URL from EXPO_PUBLIC_API_URL or defaults to local dev.
 */

function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }
  // In development/testing, default to localhost:3000
  if (process.env.NODE_ENV !== "production" || (typeof __DEV__ !== "undefined" && __DEV__)) {
    return "http://localhost:3000";
  }
  // In production builds without configured backend, avoid hardcoding localhost/127.0.0.1
  return "";
}

export const API_BASE_URL = resolveApiBaseUrl();

export const APP_CONFIG = {
  appName: "UniMate",
  version: "1.0.0",
  apiBaseUrl: API_BASE_URL,
  apiTimeoutMs: 15000,
} as const;
