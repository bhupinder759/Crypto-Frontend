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

/**
 * Thin pass-through for BFF routes: forwards method, query string and JSON body
 * to the backend with the session cookie's bearer token.
 */
export async function proxyJson(
  request: Request,
  backendPath: string,
): Promise<Response> {
  const { backendFetch } = await import("@/lib/api/backend");
  try {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const body = method === "GET" || method === "DELETE" ? undefined : await request.text();
    const response = await backendFetch(backendPath, {
      method,
      searchParams: url.searchParams,
      ...(body ? { body } : {}),
    });
    return NextResponse.json(response ?? { success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
