import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { handleRouteError } from "@/lib/api/route-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const response = await backendFetch(`/api/v1/admin/wallet/withdrawals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
