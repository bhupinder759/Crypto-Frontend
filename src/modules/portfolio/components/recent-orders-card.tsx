"use client";

import Link from "next/link";
import type { Route } from "next";
import { QueryErrorCard } from "@/components/common/query-error-card";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/constants/routes";
import { formatFixed } from "@/lib/utils/precision";
import { useOrdersHistoryQuery } from "@/modules/orders/hooks/use-orders";
import {
  OrderSide,
  OrderStatusBadge,
} from "@/modules/orders/utils/order-status";

export function RecentOrdersCard({ accountId }: { accountId?: string }) {
  const query = useOrdersHistoryQuery(accountId);
  const orders = (query.data ?? []).slice(0, 8);

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex h-9 items-center justify-between border-b border-border px-3">
        <h2 className="text-xs font-medium">Recent orders</h2>
        <Link
          href={routes.orders as Route}
          className="text-[11px] text-muted-foreground hover:text-foreground"
        >
          All orders →
        </Link>
      </header>
      {query.isError ? (
        <QueryErrorCard
          compact
          className="m-3"
          title="Couldn't load orders"
          error={query.error}
          onRetry={query.refetch}
        />
      ) : query.isLoading ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="px-3 py-8 text-center text-xs text-muted-foreground">
          No orders yet.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex items-center gap-2 px-3 py-2 text-xs"
            >
              <OrderSide side={order.side} />
              <Link
                href={`${routes.trading}/${order.symbol}` as Route}
                className="font-medium hover:text-primary"
              >
                {order.symbol}
              </Link>
              <span className="text-muted-foreground tabular">
                {order.quantity} @{" "}
                {order.price == null ? "Market" : formatFixed(order.price, 2)}
              </span>
              <span className="ml-auto">
                <OrderStatusBadge status={order.status} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
