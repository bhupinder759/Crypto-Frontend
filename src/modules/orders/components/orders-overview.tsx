"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { OrdersTable } from "@/modules/orders/components/orders-table";
import { useOrdersHistoryQuery } from "@/modules/orders/hooks/use-orders";

export function OrdersOverview({ accountId }: { accountId?: string }) {
  const ordersQuery = useOrdersHistoryQuery(accountId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Execution History"
        title="Orders"
        description="Track placed, cancelled, and filled orders across the exchange backend."
      />
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersTable orders={ordersQuery.data ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
