import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/lib/constants/config";
import { routes } from "@/lib/constants/routes";
import { backendFetch } from "@/lib/api/backend";
import type { AccountDto, SessionPayload, UserDto } from "@/modules/auth/types";

const loadServerSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const [user, account] = await Promise.all([
      backendFetch<UserDto>("/api/v1/auth/me", { token }),
      backendFetch<AccountDto>("/api/v1/accounts", {
        token,
      }).catch(() => null),
    ]);

    return { user, account };
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
