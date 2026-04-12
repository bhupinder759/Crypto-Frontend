import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";

export async function GET() {
  try {
    const backendSymbols = await backendFetch<string[]>("/api/v1/market/symbols");
    return NextResponse.json(Array.isArray(backendSymbols) ? backendSymbols : []);
  } catch (error) {
    return handleRouteError(error);
  }
}
