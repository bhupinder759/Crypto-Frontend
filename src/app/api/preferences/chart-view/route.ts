import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";

export async function GET(request: NextRequest) {
  try {
    const response = await backendFetch("/api/v1/preferences/chart-view", {
      searchParams: request.nextUrl.searchParams,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await backendFetch("/api/v1/preferences/chart-view", {
      method: "PUT",
      body: JSON.stringify(body),
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
