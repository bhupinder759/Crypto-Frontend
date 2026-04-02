import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";

export async function GET(request: NextRequest) {
  try {
    const response = await backendFetch("/api/v1/wallet/deposits", {
      searchParams: request.nextUrl.searchParams,
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
