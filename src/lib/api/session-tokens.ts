/**
 * Server-only helpers for the access/refresh token pair.
 *
 * - access token: httpOnly cookie that expires slightly before the JWT does
 * - refresh token: httpOnly cookie, single-use (rotated on every refresh)
 *
 * Refreshes are de-duplicated per refresh token (process-wide), because a
 * page load fires many parallel requests and replaying a used refresh token
 * makes the backend revoke the whole session.
 */
import { env } from "@/config/env";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/constants/config";

export type TokenSet = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  sessionId?: string;
};

type CookieOptions = {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
};

type CookieSetter = (name: string, value: string, options: CookieOptions) => void;

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

function options(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function applyTokenCookies(set: CookieSetter, tokens: TokenSet) {
  // Expire the cookie ~30s before the JWT so the proxy refreshes proactively.
  const accessMaxAge = Math.max(30, (tokens.expiresIn ?? 900) - 30);
  set(AUTH_COOKIE_NAME, tokens.accessToken, options(accessMaxAge));
  if (tokens.refreshToken) {
    set(REFRESH_COOKIE_NAME, tokens.refreshToken, options(REFRESH_MAX_AGE));
  }
}

type RefreshEntry = { promise: Promise<TokenSet | null>; expires: number };

const globalStore = globalThis as typeof globalThis & {
  __nexfinRefresh?: Map<string, RefreshEntry>;
};
const inflight = (globalStore.__nexfinRefresh ??= new Map());

async function callRefresh(refreshToken: string): Promise<TokenSet | null> {
  try {
    const response = await fetch(new URL("/api/v1/auth/refresh", env.backendHttpUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as TokenSet;
    return data?.accessToken ? data : null;
  } catch {
    return null;
  }
}

/** Exchanges a refresh token once; concurrent callers share the result for 30s. */
export function refreshSession(refreshToken: string): Promise<TokenSet | null> {
  const now = Date.now();
  for (const [key, entry] of inflight) {
    if (entry.expires < now) inflight.delete(key);
  }
  const existing = inflight.get(refreshToken);
  if (existing) return existing.promise;
  const promise = callRefresh(refreshToken);
  inflight.set(refreshToken, { promise, expires: now + 30_000 });
  return promise;
}
