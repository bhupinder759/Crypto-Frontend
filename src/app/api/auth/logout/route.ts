import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  TRADING_MODE_COOKIE_NAME,
} from "@/lib/constants/config";

/** Revokes the whole backend session (access + refresh) and clears cookies. */
export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  if (accessToken || refreshToken) {
    try {
      await backendFetch("/api/v1/auth/logout", {
        method: "POST",
        token: accessToken ?? "",
        retried: true,
        body: JSON.stringify({ accessToken, refreshToken }),
      });
    } catch {
      // Session may already be gone; clearing cookies is what matters locally.
    }
  }

  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
  cookieStore.delete(TRADING_MODE_COOKIE_NAME);
  return NextResponse.json({ success: true });
}
