import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { loadSessionPayload } from "@/lib/api/load-session-payload";
import { handleRouteError } from "@/lib/api/route-response";
import { applyTokenCookies, type TokenSet } from "@/lib/api/session-tokens";
import { TRADING_MODE_COOKIE_NAME } from "@/lib/constants/config";

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

    const tokens = await backendFetch<TokenSet>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
      }),
    });
    const { accessToken } = tokens;

    const cookieStore = await cookies();
    applyTokenCookies((name, value, opts) => cookieStore.set(name, value, opts), tokens);

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
