import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";
import { routes } from "@/lib/constants/routes";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { RegisterForm } from "@/modules/auth/components/register-form";

export const metadata: Metadata = {
  title: "Register",
};

export default async function RegisterPage() {
  if (await getServerSession()) {
    redirect(routes.dashboard);
  }

  return (
    <AuthShell
      title="Create your exchange account"
      description="Start with demo funds. Switch to a real account anytime."
    >
      <RegisterForm />
    </AuthShell>
  );
}
