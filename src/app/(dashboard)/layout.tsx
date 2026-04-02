import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { requireServerSession } from "@/lib/api/server-session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireServerSession();
  return <DashboardShell session={session}>{children}</DashboardShell>;
}
