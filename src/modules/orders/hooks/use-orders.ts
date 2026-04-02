"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrderHistory } from "@/modules/orders/services/orders.api";

export function useOrdersHistoryQuery(accountId?: string) {
  return useQuery({
    queryKey: ["orders", "history", accountId],
    queryFn: () => getOrderHistory({ accountId: accountId!, limit: 100 }),
    enabled: Boolean(accountId),
    refetchInterval: 15_000,
  });
}
