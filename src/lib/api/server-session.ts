import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/lib/constants/config";
import { routes } from "@/lib/constants/routes";
import { loadSessionPayload } from "@/lib/api/load-session-payload";
import type { SessionPayload } from "@/modules/auth/types";

const loadServerSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await loadSessionPayload(token);
  } catch {
    return null;
  }
});

export async function getServerSession(): Promise<SessionPayload | null> {
  return loadServerSession();
}

export async function requireServerSession() {
  const session = await getServerSession();

  if (!session) {
    redirect(routes.login);
  }

  return session;
}
