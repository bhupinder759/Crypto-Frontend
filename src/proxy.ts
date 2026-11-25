import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/constants/config";
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

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Optimistic auth check only (cookie presence). Real authorization, including
 * the ADMIN role on /admin, is enforced server-side in the layouts/route handlers.
 * Signed-in users hitting /login are redirected by the page itself after the
 * session is validated, so an expired cookie can never cause a redirect loop.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname, search } = request.nextUrl;

  const isProtected = protectedPrefixes.some((prefix) =>
    matchesPrefix(pathname, prefix),
  );

  if (!token && isProtected) {
    const loginUrl = new URL(routes.login, request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
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
  ],
};
