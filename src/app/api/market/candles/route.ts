import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";
import { getReferenceCandles } from "@/lib/market/reference-market";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "";
  const interval = request.nextUrl.searchParams.get("interval") ?? "1m";
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "60");

  try {
    const response = await backendFetch("/api/v1/market/candles", {
      searchParams: request.nextUrl.searchParams,
    });

    if (Array.isArray(response) && response.length > 0) {
      return NextResponse.json(response);
    }
  } catch {}

  try {
    const reference = await getReferenceCandles(symbol, interval, limit);
    if (reference.length > 0) {
      return NextResponse.json(reference);
    }
  } catch (error) {
    return handleRouteError(error);
  }

  return NextResponse.json([]);
}
