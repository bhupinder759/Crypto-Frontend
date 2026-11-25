import { redirect } from "next/navigation";
import { MetricCard } from "@/components/common/metric-card";
import { PageHeader } from "@/components/common/page-header";
import { routes } from "@/lib/constants/routes";
import { requireServerSession } from "@/lib/api/server-session";

export default async function DashboardPage() {
  const session = await requireServerSession();

  if (session.user.role === "ADMIN") {
    redirect(routes.admin);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Operations"
        title="Overview"
        description="Your account at a glance."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Session Role" value={session.user.role} />
        <MetricCard title="Account Status" value={session.account?.status ?? "UNSET"} />
        <MetricCard title="KYC State" value={session.account?.kyc ?? "NONE"} />
        <MetricCard title="Jurisdiction" value={session.account?.country ?? "N/A"} />
      </div>
    </div>
  );
}
