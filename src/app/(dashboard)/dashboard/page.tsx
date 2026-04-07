import { redirect } from "next/navigation";
import { MetricCard } from "@/components/common/metric-card";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { routes } from "@/lib/constants/routes";
import { requireServerSession } from "@/lib/api/server-session";

export default async function DashboardPage() {
  const session = await requireServerSession();

  if (session.user.role === "ADMIN") {
    redirect(routes.admin);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Exchange Overview"
        description="Monitor account posture, market access, and backend-connected exchange features from one place."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Session Role" value={session.user.role} />
        <MetricCard title="Account Status" value={session.account?.status ?? "UNSET"} />
        <MetricCard title="KYC State" value={session.account?.kyc ?? "NONE"} />
        <MetricCard title="Jurisdiction" value={session.account?.country ?? "N/A"} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Platform Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>The frontend is connected to the NestJS exchange backend through a BFF layer under <code>/api</code>.</p>
          <p>Trading, wallet, orders, and market data pages are wired to real backend controllers, and realtime order book / trade streams connect over the backend raw WebSocket gateway.</p>
        </CardContent>
      </Card>
    </div>
  );
}
