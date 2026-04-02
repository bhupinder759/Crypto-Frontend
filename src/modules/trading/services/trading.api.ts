"use client";

import { apiGet, apiPost } from "@/lib/api/api-client";
import type { OrderDto, OrderFormInput } from "@/modules/trading/types";

export function createOrder(payload: OrderFormInput) {
  return apiPost<{ message: string; orderId: string }, OrderFormInput>(
    "/orders",
    payload,
  );
}

export function cancelOrder(payload: { orderId: string; accountId: string }) {
  return apiPost<{ message: string }, { orderId: string; accountId: string }>(
    "/orders/cancel",
    payload,
  );
}

export function getOrders(params: {
  accountId: string;
  symbol?: string;
  status?: string;
  limit?: number;
}) {
  return apiGet<OrderDto[]>("/orders", params);
}

export function getOrder(id: string) {
  return apiGet<OrderDto>(`/orders/${id}`);
}
