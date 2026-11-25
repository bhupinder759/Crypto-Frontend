"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPost } from "@/lib/api/api-client";

export type AlertCondition = "ABOVE" | "BELOW";

export interface PriceAlertDto {
  id: string;
  symbol: string;
  condition: AlertCondition;
  price: string;
  note: string | null;
  status: "ACTIVE" | "TRIGGERED" | "CANCELLED";
  triggeredAt: string | null;
  triggeredPrice: string | null;
  createdAt: string;
}

export const MAX_ACTIVE_ALERTS = 50;

export function useAlertsQuery() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const raw = await apiGet<unknown>("/alerts");
      return (Array.isArray(raw) ? raw : []) as PriceAlertDto[];
    },
    staleTime: 30_000,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      symbol: string;
      condition: AlertCondition;
      price: string;
      note?: string;
    }) => apiPost<PriceAlertDto>("/alerts", input),
    onSuccess: (alert) =>
      toast.success(
        `Alert set: ${alert.symbol} ${alert.condition === "ABOVE" ? "≥" : "≤"} ${alert.price}`,
      ),
    onError: (error) => toast.error(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/alerts/${encodeURIComponent(id)}`),
    onMutate: (id) => {
      queryClient.setQueryData<PriceAlertDto[]>(["alerts"], (current) =>
        current?.filter((a) => a.id !== id),
      );
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

/** Suggests the condition from the target vs current price. */
export function inferCondition(
  target: string,
  last: number | null,
): AlertCondition {
  if (last == null || !(Number(target) > 0)) return "ABOVE";
  return Number(target) >= last ? "ABOVE" : "BELOW";
}
