import { NextResponse } from "next/server";
import { BackendRequestError } from "@/lib/api/backend";

export function handleRouteError(error: unknown) {
  if (error instanceof BackendRequestError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status },
    );
  }

  return NextResponse.json(
    { message: error instanceof Error ? error.message : "Unknown server error" },
    { status: 500 },
  );
}
