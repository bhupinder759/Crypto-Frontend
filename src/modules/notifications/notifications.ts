"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api/api-client";

export type NotificationType =
  | "PRICE_ALERT"
  | "ORDER_FILLED"
  | "DEPOSIT_CREDITED"
  | "WITHDRAWAL_COMPLETED"
  | "WITHDRAWAL_FAILED"
  | string;

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsPage {
  items: NotificationDto[];
  unreadCount: number;
}

export const notificationsKey = ["notifications"] as const;

export function normalizeNotifications(raw: unknown): NotificationsPage {
  const page = (raw ?? {}) as Partial<NotificationsPage>;
  return {
    items: Array.isArray(page.items) ? page.items : [],
    unreadCount: Number(page.unreadCount ?? 0),
  };
}

export function useNotificationsQuery(enabled = true) {
  return useQuery({
    queryKey: notificationsKey,
    queryFn: async () =>
      normalizeNotifications(
        await apiGet<unknown>("/notifications", { limit: 20 }),
      ),
    enabled,
    staleTime: 60_000,
    // Live updates arrive over the /user stream; this is a slow safety net.
    refetchInterval: 120_000,
  });
}

/** Inserts a live notification into the cached page (newest first). */
export function pushNotification(
  queryClient: ReturnType<typeof useQueryClient>,
  item: NotificationDto,
) {
  queryClient.setQueryData<NotificationsPage>(notificationsKey, (current) => {
    const items = current?.items ?? [];
    if (items.some((n) => n.id === item.id)) return current;
    return {
      items: [item, ...items].slice(0, 50),
      unreadCount: (current?.unreadCount ?? 0) + (item.read ? 0 : 1),
    };
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPost(`/notifications/${encodeURIComponent(id)}/read`),
    onMutate: (id) => {
      queryClient.setQueryData<NotificationsPage>(
        notificationsKey,
        (current) =>
          current
            ? {
                items: current.items.map((n) =>
                  n.id === id ? { ...n, read: true } : n,
                ),
                unreadCount: Math.max(
                  0,
                  current.unreadCount -
                    (current.items.find((n) => n.id === id && !n.read) ? 1 : 0),
                ),
              }
            : current,
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost("/notifications/read-all"),
    onMutate: () => {
      queryClient.setQueryData<NotificationsPage>(
        notificationsKey,
        (current) =>
          current
            ? {
                items: current.items.map((n) => ({ ...n, read: true })),
                unreadCount: 0,
              }
            : current,
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}
