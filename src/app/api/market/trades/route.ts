import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";
import { getReferenceTrades } from "@/lib/market/reference-market";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "";
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "50");

  try {
    const response = await backendFetch("/api/v1/market/trades", {
      searchParams: request.nextUrl.searchParams,
    });

    if (Array.isArray(response) && response.length > 0) {
      return NextResponse.json(response);
    }
  } catch {}

  try {
    const reference = await getReferenceTrades(symbol, limit);
    return NextResponse.json(reference);
  } catch (error) {
    return handleRouteError(error);
  }
}
