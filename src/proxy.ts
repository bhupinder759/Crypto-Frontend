import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyTokenCookies, refreshSession } from "@/lib/api/session-tokens";
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/constants/config";
import { routes } from "@/lib/constants/routes";

const protectedPrefixes = [
  routes.dashboard,
  routes.trading,
  routes.markets,
  routes.wallet,
  routes.orders,
  routes.settings,
  routes.admin,
];

/** Auth endpoints manage cookies themselves and must never trigger a refresh. */
const AUTH_API = /^\/api\/auth\/(login|register|logout)$/;

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * 1. Transparent refresh: when the access cookie has expired but a refresh
 *    cookie exists, rotate tokens and forward the request with the new one.
 * 2. Optimistic auth gate for app pages (cookie presence). Real
 *    authorization (incl. ADMIN on /admin) is enforced server-side.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  let access = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  let response: NextResponse | null = null;

  if (!access && refresh && !AUTH_API.test(pathname)) {
    const tokens = await refreshSession(refresh);
    if (tokens) {
      access = tokens.accessToken;
      request.cookies.set(AUTH_COOKIE_NAME, tokens.accessToken);
      if (tokens.refreshToken) request.cookies.set(REFRESH_COOKIE_NAME, tokens.refreshToken);
      response = NextResponse.next({ request: { headers: request.headers } });
      applyTokenCookies((name, value, opts) => response!.cookies.set(name, value, opts), tokens);
    } else {
      response = NextResponse.next();
      response.cookies.delete(REFRESH_COOKIE_NAME);
    }
  }

  const isProtected = protectedPrefixes.some((prefix) => matchesPrefix(pathname, prefix));
  if (!access && isProtected) {
    const loginUrl = new URL(routes.login, request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    const redirect = NextResponse.redirect(loginUrl);
    if (response) {
      for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    }
    return redirect;
  }

  return response ?? NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/trading/:path*",
    "/markets/:path*",
    "/wallet/:path*",
    "/orders/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/login",
    "/api/:path*",
  ],
};
