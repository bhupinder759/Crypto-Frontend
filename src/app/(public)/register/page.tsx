import type { Metadata } from "next";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { RegisterForm } from "@/modules/auth/components/register-form";

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your exchange account"
      description="Register, bootstrap a trading account, and enter the dashboard in one flow."
    >
      <RegisterForm />
    </AuthShell>
  );
}
