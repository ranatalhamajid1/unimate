/**
 * Unified Mobile API Client for UniMate.
 * Handles automatic Bearer token injection, typed responses, and centralized error handling.
 */

import { API_BASE_URL, APP_CONFIG } from "@/lib/config";
import { getAuthToken } from "@/lib/auth-storage";
import { ApiError } from "@/lib/types";

export type UnauthorizedHandler = () => void;

let onUnauthorizedCallback: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorizedCallback = handler;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  if (!API_BASE_URL && !path.startsWith("http")) {
    throw {
      message: "API URL is not configured. Please set EXPO_PUBLIC_API_URL in production.",
      status: 0,
    } as ApiError;
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  if (!options.skipAuth) {
    const token = await getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.apiTimeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    // Centralized 401 Unauthorized handling
    if (response.status === 401) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    let responseData: any;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const error: ApiError = {
        message:
          responseData?.error ||
          responseData?.message ||
          `Request failed with status ${response.status}`,
        code: responseData?.code,
        status: response.status,
        errors: responseData?.errors,
      };
      throw error;
    }

    return responseData as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw {
        message: "Request timed out. Please check your connection and try again.",
        status: 408,
      } as ApiError;
    }

    if (error.status) {
      throw error;
    }

    // Network error or unexpected exception
    throw {
      message: error.message || "Network connection error. Please verify server is reachable.",
      status: 0,
    } as ApiError;
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};

export const apiGet = apiClient.get;
export const apiPost = apiClient.post;
export const apiPut = apiClient.put;
export const apiPatch = apiClient.patch;
export const apiDelete = apiClient.delete;
