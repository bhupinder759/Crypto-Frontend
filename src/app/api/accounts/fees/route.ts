import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";

export async function GET() {
  try {
    const response = await backendFetch("/api/v1/accounts/fees");
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
