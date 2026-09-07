/**
 * Secure Token Storage for UniMate Mobile using expo-secure-store.
 * Never uses unencrypted AsyncStorage for auth tokens.
 */

const AUTH_TOKEN_KEY = "unimate_auth_token";

// In-memory fallback for unit testing / web / mock environments
let memoryToken: string | null = null;

function getSecureStore(): any {
  try {
    // Only load native module if available
    return require("expo-secure-store");
  } catch {
    return null;
  }
}

function isNativePlatform(): boolean {
  try {
    const { Platform } = require("react-native");
    return Platform && Platform.OS !== "web";
  } catch {
    return false;
  }
}

export async function getAuthToken(): Promise<string | null> {
  const secureStore = getSecureStore();
  if (!secureStore || !isNativePlatform()) {
    return memoryToken;
  }

  try {
    const token = await secureStore.getItemAsync(AUTH_TOKEN_KEY);
    return token;
  } catch (error) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn("SecureStore get error, using fallback:", error);
    }
    return memoryToken;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  memoryToken = token;
  const secureStore = getSecureStore();
  if (!secureStore || !isNativePlatform()) {
    return;
  }

  try {
    await secureStore.setItemAsync(AUTH_TOKEN_KEY, token, {
      keychainAccessible: secureStore.AFTER_FIRST_UNLOCK,
    });
  } catch (error) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn("SecureStore set error, retained in memory:", error);
    }
  }
}

export async function clearAuthToken(): Promise<void> {
  memoryToken = null;
  const secureStore = getSecureStore();
  if (!secureStore || !isNativePlatform()) {
    return;
  }

  try {
    await secureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn("SecureStore delete error:", error);
    }
  }
}
