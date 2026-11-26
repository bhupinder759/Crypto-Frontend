"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { QueryErrorCard } from "@/components/common/query-error-card";
import { OrdersTable } from "@/modules/orders/components/orders-table";
import { useOrdersHistoryQuery } from "@/modules/orders/hooks/use-orders";

export function OrdersOverview({ accountId }: { accountId?: string }) {
  const ordersQuery = useOrdersHistoryQuery(accountId);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Execution History"
        title="Orders"
        description="Open, filled and cancelled orders."
      />
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersQuery.isError ? (
            <QueryErrorCard
              title="Couldn't load orders"
              error={ordersQuery.error}
              onRetry={ordersQuery.refetch}
              retrying={ordersQuery.isFetching}
            />
          ) : (
            <OrdersTable orders={ordersQuery.data ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
