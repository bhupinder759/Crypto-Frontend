import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";
import { TRADING_MODE_COOKIE_NAME } from "@/lib/constants/config";
import type { TradingModeContextDto } from "@/modules/auth/types";

export async function GET() {
  try {
    const response = await backendFetch<TradingModeContextDto>(
      "/api/v1/trading-mode",
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = (await request.json()) as { mode: "DEMO" | "REAL" };
    const response = await backendFetch<TradingModeContextDto>(
      "/api/v1/trading-mode",
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    const cookieStore = await cookies();
    cookieStore.set(TRADING_MODE_COOKIE_NAME, response.activeMode, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
