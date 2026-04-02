import type { Metadata } from "next";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { LoginForm } from "@/modules/auth/components/login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in to Nexfin"
      description="Access trading, wallet operations, and exchange monitoring from a single control surface."
    >
      <LoginForm />
    </AuthShell>
  );
}
