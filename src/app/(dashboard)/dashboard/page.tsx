import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { requireServerSession } from "@/lib/api/server-session";
import { routes } from "@/lib/constants/routes";
import { PortfolioDashboard } from "@/modules/portfolio/components/portfolio-dashboard";

export const metadata: Metadata = {
  title: "Portfolio",
};

export default async function DashboardPage() {
  const session = await requireServerSession();

  if (session.user.role === "ADMIN") {
    redirect(routes.admin);
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Portfolio" />
      <PortfolioDashboard session={session} />
    </div>
  );
}
