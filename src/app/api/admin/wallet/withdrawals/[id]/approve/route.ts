import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const response = await backendFetch(`/api/v1/admin/wallet/withdrawals/${id}/approve`, {
      method: "POST",
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
