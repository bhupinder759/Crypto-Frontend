import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const response = await backendFetch("/api/v1/demo/faucet", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
