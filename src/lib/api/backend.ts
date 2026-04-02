import { cookies } from "next/headers";
import { env } from "@/config/env";
import { AUTH_COOKIE_NAME } from "@/lib/constants/config";

type BackendFetchOptions = RequestInit & {
  token?: string;
  searchParams?: URLSearchParams;
};

export class BackendRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function backendFetch<T>(
  path: string,
  options: BackendFetchOptions = {},
): Promise<T> {
  const cookieStore = await cookies();
  const token = options.token ?? cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const url = new URL(path, env.backendHttpUrl);

  if (options.searchParams) {
    url.search = options.searchParams.toString();
  }

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      ...options,
      headers,
      cache: options.cache ?? "no-store",
    });
  } catch {
    throw new BackendRequestError(
      `Backend service unavailable at ${env.backendHttpUrl}. Start the backend and retry.`,
      503,
    );
  }

  if (!response.ok) {
    const payload = (await safeJson(response)) as { message?: string } | null;
    throw new BackendRequestError(
      payload?.message ?? "Backend request failed",
      response.status,
    );
  }

  return (await safeJson(response)) as T;
}

export async function safeJson(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
