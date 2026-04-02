import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";
import { getReferenceOrderBook } from "@/lib/market/reference-market";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "";

  try {
    const response = await backendFetch("/api/v1/market/orderbook", {
      searchParams: request.nextUrl.searchParams,
    });

    if (response) {
      return NextResponse.json(response);
    }
  } catch {}

  try {
    const reference = await getReferenceOrderBook(symbol);
    return NextResponse.json(reference);
  } catch (error) {
    return handleRouteError(error);
  }
}
