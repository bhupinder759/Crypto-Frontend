import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";
import { getReferenceTicker } from "@/lib/market/reference-market";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "";

  try {
    const response = await backendFetch("/api/v1/market/ticker", {
      searchParams: request.nextUrl.searchParams,
    });

    if (
      response &&
      typeof response === "object" &&
      "lastPrice" in response &&
      String(response.lastPrice ?? "0") !== "0"
    ) {
      return NextResponse.json(response);
    }
  } catch {}

  try {
    const reference = await getReferenceTicker(symbol);
    if (reference) {
      return NextResponse.json(reference);
    }
  } catch (error) {
    return handleRouteError(error);
  }

  return handleRouteError(new Error(`No ticker data available for ${symbol}`));
}
