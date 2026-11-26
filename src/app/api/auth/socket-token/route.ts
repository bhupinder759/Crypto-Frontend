import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/constants/config";

/**
 * Hands the short-lived access token to the browser for the private Socket.IO
 * `/user` handshake (the cookie itself stays httpOnly). The proxy refreshes
 * the cookie first when it has expired.
 */
export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ token }, { headers: { "Cache-Control": "no-store" } });
}
