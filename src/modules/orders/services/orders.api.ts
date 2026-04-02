"use client";

import { apiGet } from "@/lib/api/api-client";
import type { OrderDto } from "@/modules/trading/types";

export function getOrderHistory(params: {
  accountId: string;
  symbol?: string;
  status?: string;
  limit?: number;
}) {
  return apiGet<OrderDto[]>("/orders", params);
}
