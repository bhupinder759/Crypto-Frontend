import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/constants/config";
import { routes } from "@/lib/constants/routes";

const protectedPrefixes = ["/dashboard", "/trading", "/wallet", "/orders", "/settings"];
const publicAuthRoutes = [routes.login, routes.register];

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isPublicAuth = publicAuthRoutes.includes(pathname as (typeof publicAuthRoutes)[number]);

  if (!token && isProtected) {
    return NextResponse.redirect(new URL(routes.login, request.url));
  }

  if (token && isPublicAuth) {
    return NextResponse.redirect(new URL(routes.dashboard, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/trading/:path*", "/wallet/:path*", "/orders/:path*", "/settings/:path*", "/login", "/register"],
};
