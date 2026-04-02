import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";

export async function GET() {
  try {
    const account = await backendFetch("/api/v1/accounts");
    return NextResponse.json(account);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    await backendFetch("/api/v1/accounts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const account = await backendFetch("/api/v1/accounts");
    return NextResponse.json(account);
  } catch (error) {
    return handleRouteError(error);
  }
}
