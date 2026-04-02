import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";

export async function GET(request: NextRequest) {
  try {
    const response = await backendFetch("/api/v1/orders", {
      searchParams: request.nextUrl.searchParams,
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const response = await backendFetch("/api/v1/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
