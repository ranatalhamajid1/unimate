/**
 * Authentication Context & Provider for UniMate Mobile.
 * Manages token lifecycle with expo-secure-store, user profile state,
 * centralized 401 eviction, and React Query cache invalidation.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Subscription, AuthResponse, MeResponse } from "@/lib/types";
import { getAuthToken, setAuthToken, clearAuthToken } from "@/lib/auth-storage";
import { apiGet, apiPost, setUnauthorizedHandler } from "@/lib/api-client";
import { clearQueryCache } from "@/lib/query-client";

export interface AuthContextValue {
  user: User | null;
  subscription: Subscription | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; errors?: Record<string, string[]> }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = useCallback(async () => {
    try {
      await apiPost("/api/mobile/auth/logout", {}, { skipAuth: false }).catch(() => {});
    } finally {
      await clearAuthToken();
      clearQueryCache();
      setTokenState(null);
      setUser(null);
      setSubscription(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiGet<MeResponse>("/api/mobile/me");
      if (res.success && res.user) {
        setUser(res.user);
        setSubscription(res.subscription);
      }
    } catch (error: any) {
      if (error?.status === 401) {
        await handleLogout();
      }
    }
  }, [handleLogout]);

  // Initial bootstrap: check for token in SecureStore
  useEffect(() => {
    async function bootstrap() {
      try {
        const storedToken = await getAuthToken();
        if (storedToken) {
          setTokenState(storedToken);
          const res = await apiGet<MeResponse>("/api/mobile/me");
          if (res.success && res.user) {
            setUser(res.user);
            setSubscription(res.subscription);
          } else {
            await clearAuthToken();
            setTokenState(null);
          }
        }
      } catch (error: any) {
        // If 401 or invalid token, wipe token
        await clearAuthToken();
        setTokenState(null);
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();

    // Register 401 handler
    setUnauthorizedHandler(() => {
      clearAuthToken();
      clearQueryCache();
      setTokenState(null);
      setUser(null);
      setSubscription(null);
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiPost<AuthResponse>(
        "/api/mobile/auth/login",
        { email, password },
        { skipAuth: true }
      );

      if (res.success && res.token && res.user) {
        await setAuthToken(res.token);
        setTokenState(res.token);
        setUser(res.user);
        // Fetch full me profile + subscription
        try {
          const meRes = await apiGet<MeResponse>("/api/mobile/me");
          if (meRes.success) {
            setSubscription(meRes.subscription);
          }
        } catch {
          // Fallback subscription
          setSubscription({ plan: "FREE", isPro: false, status: "ACTIVE" });
        }
        return { success: true };
      }

      return {
        success: false,
        error: res.error || "Login failed. Please check your credentials.",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Invalid email or password.",
      };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const res = await apiPost<AuthResponse>(
        "/api/mobile/auth/signup",
        { name, email, password },
        { skipAuth: true }
      );

      if (res.success && res.token && res.user) {
        await setAuthToken(res.token);
        setTokenState(res.token);
        setUser(res.user);
        setSubscription({ plan: "FREE", isPro: false, status: "ACTIVE" });
        return { success: true };
      }

      return {
        success: false,
        error: res.error || "Signup failed.",
        errors: res.errors,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to create account.",
        errors: error.errors,
      };
    }
  };

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        token,
        isLoading,
        isAuthenticated,
        login,
        signup,
        logout: handleLogout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
