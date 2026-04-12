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
      country: string;
    };

    await backendFetch<{ userId: string }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
      }),
    });

    const { accessToken } = await backendFetch<{ accessToken: string }>(
      "/api/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
        }),
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

    const { accountId } = await backendFetch<{ accountId: string }>(
      "/api/v1/accounts",
      {
        token: accessToken,
        method: "POST",
        body: JSON.stringify({
          country: payload.country,
        }),
      },
    );
    const session = await loadSessionPayload(accessToken);
    cookieStore.set(TRADING_MODE_COOKIE_NAME, session.tradingMode, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({
      ...session,
      realAccount: session.realAccount ?? {
        id: accountId,
        status: "ACTIVE",
        kyc: "NONE",
        country: payload.country,
        currency: "USD",
        mode: "REAL",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
