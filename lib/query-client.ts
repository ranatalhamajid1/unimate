/**
 * Global TanStack Query Client Configuration.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes
      retry: (failureCount, error: any) => {
        // Never retry on 401 Unauthorized or 403 Forbidden
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export function clearQueryCache(): void {
  queryClient.clear();
}
