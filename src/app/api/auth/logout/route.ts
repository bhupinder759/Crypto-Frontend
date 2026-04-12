import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";
import {
  AUTH_COOKIE_NAME,
  TRADING_MODE_COOKIE_NAME,
} from "@/lib/constants/config";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  try {
    if (token) {
      await backendFetch("/api/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ accessToken: token }),
      });
    }

    cookieStore.delete(AUTH_COOKIE_NAME);
    cookieStore.delete(TRADING_MODE_COOKIE_NAME);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
