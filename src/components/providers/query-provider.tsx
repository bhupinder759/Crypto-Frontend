"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/lib/api/axios";

/** Retry network/5xx/429 a few times with backoff; never retry other 4xx. */
function shouldRetry(failureCount: number, error: unknown) {
  const status = error instanceof ApiError ? error.status : undefined;
  if (status === 429) return failureCount < 3;
  if (status && status >= 400 && status < 500) return false;
  return failureCount < 1;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: shouldRetry,
            retryDelay: (attempt, error) =>
              error instanceof ApiError && error.status === 429
                ? Math.min(30_000, 5_000 * 2 ** attempt)
                : Math.min(10_000, 1_000 * 2 ** attempt),
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
