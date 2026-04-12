import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";

export async function GET(request: NextRequest) {
  try {
    const response = await backendFetch("/api/v1/market/trades", {
      searchParams: request.nextUrl.searchParams,
    });
    return NextResponse.json(Array.isArray(response) ? response : []);
  } catch (error) {
    return handleRouteError(error);
  }
}
