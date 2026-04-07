import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";
import { getReferenceInstrument, getReferenceInstruments } from "@/lib/market/reference-market";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? undefined;

  try {
    const response = await backendFetch("/api/v1/market/instruments", {
      searchParams: request.nextUrl.searchParams,
    });

    if (symbol) {
      return NextResponse.json(response ?? getReferenceInstrument(symbol));
    }

    if (Array.isArray(response)) {
      const merged = [
        ...response,
        ...getReferenceInstruments().filter(
          (instrument) =>
            !response.some((existing) => existing.symbol === instrument.symbol),
        ),
      ];
      return NextResponse.json(merged);
    }
  } catch {}

  try {
    return NextResponse.json(
      symbol ? getReferenceInstrument(symbol) : getReferenceInstruments(),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
