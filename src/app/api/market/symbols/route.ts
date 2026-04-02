import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";
import { getReferenceSymbols } from "@/lib/market/reference-market";

export async function GET() {
  try {
    const backendSymbols = await backendFetch<string[]>("/api/v1/market/symbols").catch(
      () => [],
    );
    return NextResponse.json(
      [...new Set([...backendSymbols, ...getReferenceSymbols()])].sort(),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
