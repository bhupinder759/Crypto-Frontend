import { redirect } from "next/navigation";
import { requireServerSession } from "@/lib/api/server-session";
import { routes } from "@/lib/constants/routes";
import { AdminOverview } from "@/modules/admin/components/admin-overview";

export default async function AdminPage() {
  const session = await requireServerSession();

  if (session.user.role !== "ADMIN") {
    redirect(routes.dashboard);
  }

  return <AdminOverview />;
}
