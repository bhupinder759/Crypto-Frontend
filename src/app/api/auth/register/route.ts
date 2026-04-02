import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";
import { AUTH_COOKIE_NAME } from "@/lib/constants/config";
import type { SessionPayload } from "@/modules/auth/types";

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

    const userPromise = backendFetch<SessionPayload["user"]>("/api/v1/auth/me", {
      token: accessToken,
    });
    const { accountId } = await backendFetch<{ accountId: string }>("/api/v1/accounts", {
      token: accessToken,
      method: "POST",
      body: JSON.stringify({
        country: payload.country,
      }),
    });
    const accountPromise = backendFetch<SessionPayload["account"]>("/api/v1/accounts", {
      token: accessToken,
    }).catch(() => ({
      id: accountId,
      status: "ACTIVE",
      kyc: "NONE",
      country: payload.country,
    }));
    const [user, account] = await Promise.all([userPromise, accountPromise]);

    return NextResponse.json({ user, account });
  } catch (error) {
    return handleRouteError(error);
  }
}
