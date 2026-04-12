import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { loadSessionPayload } from "@/lib/api/load-session-payload";
import { handleRouteError } from "@/lib/api/route-response";
import {
  AUTH_COOKIE_NAME,
  TRADING_MODE_COOKIE_NAME,
} from "@/lib/constants/config";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      email: string;
      password: string;
    };
    const { accessToken } = await backendFetch<{ accessToken: string }>(
      "/api/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    const session = await loadSessionPayload(accessToken);
    cookieStore.set(TRADING_MODE_COOKIE_NAME, session.tradingMode, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json(session);
  } catch (error) {
    return handleRouteError(error);
  }
}
