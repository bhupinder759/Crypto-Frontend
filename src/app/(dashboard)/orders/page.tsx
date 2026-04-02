import { requireServerSession } from "@/lib/api/server-session";
import { OrdersOverview } from "@/modules/orders/components/orders-overview";

export default async function OrdersPage() {
  const session = await requireServerSession();
  return <OrdersOverview accountId={session.account?.id} />;
}
