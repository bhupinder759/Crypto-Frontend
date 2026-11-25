"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPost } from "@/lib/api/api-client";

export interface SessionDto {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  current: boolean;
}

export const API_KEY_PERMISSIONS = [
  "read",
  "trade",
  "wallet:withdraw",
] as const;
export type ApiKeyPermission =
  (typeof API_KEY_PERMISSIONS)[number] | "wallet:admin" | "admin";

export interface ApiKeyDto {
  id: string;
  keyId: string;
  label: string | null;
  permissions: string[];
  ipWhitelist: string[];
  createdAt: string;
  lastUsedAt: string | null;
}

export interface CreatedApiKeyDto extends ApiKeyDto {
  /** Shown exactly once. */
  secret: string;
}

function normalizeKey(raw: Record<string, unknown>): ApiKeyDto {
  return {
    id: String(raw.id ?? raw.apiKeyId ?? ""),
    keyId: String(raw.keyId ?? raw.keyPrefix ?? raw.id ?? ""),
    label: (raw.label as string | null) ?? null,
    permissions: Array.isArray(raw.permissions)
      ? (raw.permissions as string[])
      : [],
    ipWhitelist: Array.isArray(raw.ipWhitelist)
      ? (raw.ipWhitelist as string[])
      : [],
    createdAt: String(raw.createdAt ?? ""),
    lastUsedAt: (raw.lastUsedAt as string | null) ?? null,
  };
}

export function useSessionsQuery() {
  return useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: async () => {
      const raw = await apiGet<unknown>("/auth/sessions");
      return (Array.isArray(raw) ? raw : []) as SessionDto[];
    },
    staleTime: 30_000,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete(`/auth/sessions/${encodeURIComponent(id)}`),
    onSuccess: () => toast.success("Session signed out"),
    onError: (error) => toast.error(error.message),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] }),
  });
}

export function useApiKeysQuery() {
  return useQuery({
    queryKey: ["auth", "api-keys"],
    queryFn: async () => {
      const raw = await apiGet<unknown>("/auth/api-keys");
      return (Array.isArray(raw) ? raw : []).map((k) =>
        normalizeKey(k as Record<string, unknown>),
      );
    },
    staleTime: 30_000,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      label?: string;
      permissions: string[];
      ipWhitelist?: string[];
    }) => {
      const raw = await apiPost<Record<string, unknown>>(
        "/auth/api-keys",
        input,
      );
      return {
        ...normalizeKey(raw),
        secret: String(raw.secret ?? raw.apiKey ?? ""),
      } as CreatedApiKeyDto;
    },
    onError: (error) => toast.error(error.message),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["auth", "api-keys"] }),
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete(`/auth/api-keys/${encodeURIComponent(id)}`),
    onSuccess: () => toast.success("API key revoked"),
    onError: (error) => toast.error(error.message),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["auth", "api-keys"] }),
  });
}

/** Human-readable device from a user agent (best effort). */
export function describeUserAgent(ua: string | null) {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : /curl\//.test(ua)
            ? "curl"
            : "Browser";
  const os = /Mac OS X/.test(ua)
    ? "macOS"
    : /Windows/.test(ua)
      ? "Windows"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return os ? `${browser} on ${os}` : browser;
}
