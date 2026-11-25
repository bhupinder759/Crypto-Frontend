import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { getServerSession } from "@/lib/api/server-session";
import { routes } from "@/lib/constants/routes";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { LoginForm } from "@/modules/auth/components/login-form";

export const metadata: Metadata = {
  title: "Login",
};

function safeNext(value: string | string[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value;
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = safeNext((await searchParams).next);
  const session = await getServerSession();

  if (session) {
    redirect((next ?? routes.dashboard) as Route);
  }

  return (
    <AuthShell
      title="Sign in to Nexfin"
      description="Trade spot crypto with live markets, demo funds and a pro order book."
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
