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

function uploadWithXHR<T>(
  method: string,
  url: string,
  formData: FormData,
  headers: Record<string, string>,
  timeoutMs: number,
  signal?: AbortSignal | null
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.timeout = timeoutMs;

    // Set headers (excluding Content-Type to allow React Native OkHttp to set multipart boundary)
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() !== "content-type") {
        xhr.setRequestHeader(key, value);
      }
    }

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return reject({
          message: "Request timed out. Please check your connection and try again.",
          status: 408,
        } as ApiError);
      }
      signal.addEventListener("abort", () => {
        xhr.abort();
        reject({
          message: "Request timed out. Please check your connection and try again.",
          status: 408,
        } as ApiError);
      });
    }

    xhr.onload = () => {
      let responseData: any;
      try {
        responseData = JSON.parse(xhr.responseText);
      } catch {
        responseData = xhr.responseText;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(responseData as T);
      } else {
        if (xhr.status === 401 && onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
        reject({
          message:
            responseData?.error ||
            responseData?.message ||
            `Request failed with status ${xhr.status}`,
          code: responseData?.code,
          status: xhr.status,
          errors: responseData?.errors,
        } as ApiError);
      }
    };

    xhr.onerror = () => {
      reject({
        message: "Network connection error. Please verify server is reachable.",
        status: 0,
      } as ApiError);
    };

    xhr.ontimeout = () => {
      reject({
        message: "Request timed out. Please check your connection and try again.",
        status: 408,
      } as ApiError);
    };

    xhr.send(formData);
  });
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

  const cleanBase = API_BASE_URL.replace(/\/+$/, "");
  const cleanPath = "/" + path.replace(/^\/+/, "");
  const url = path.startsWith("http") ? path : `${cleanBase}${cleanPath}`;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
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

  if (isFormData && typeof XMLHttpRequest !== "undefined") {
    try {
      const data = await uploadWithXHR<T>(
        method,
        url,
        body as FormData,
        headers,
        APP_CONFIG.apiTimeoutMs,
        controller.signal
      );
      clearTimeout(timeoutId);
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: isFormData ? (body as any) : body !== undefined ? JSON.stringify(body) : undefined,
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
  upload: <T>(path: string, formData: FormData, options?: RequestOptions) =>
    request<T>("POST", path, formData, options),
};

export const apiGet = apiClient.get;
export const apiPost = apiClient.post;
export const apiPut = apiClient.put;
export const apiPatch = apiClient.patch;
export const apiDelete = apiClient.delete;
export const apiUpload = apiClient.upload;
