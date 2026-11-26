"use client";

import { apiGet, apiPost } from "@/lib/api/api-client";
import type {
  CreateOrderResponse,
  FeeScheduleDto,
  FillDto,
  OrderDto,
  OrderFormInput,
} from "@/modules/trading/types";

export function createOrder(payload: OrderFormInput) {
  return apiPost<CreateOrderResponse, OrderFormInput>("/orders", payload);
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

/** Own executions (REAL accounts only; DEMO accounts get 403). */
export async function getFills(params: { accountId: string; symbol?: string; limit?: number }) {
  const raw = await apiGet<unknown>("/orders/fills", params);
  return Array.isArray(raw) ? (raw as FillDto[]) : [];
}

/** Maker/taker fees for the active REAL account. */
export function getFeeSchedule() {
  return apiGet<FeeScheduleDto>("/accounts/fees");
}
