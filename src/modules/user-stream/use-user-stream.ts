"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { env } from "@/config/env";
import { apiGet } from "@/lib/api/api-client";
import { formatFixed } from "@/lib/utils/precision";
import {
  pushNotification,
  type NotificationDto,
} from "@/modules/notifications/notifications";
import type { FillDto, OrderDto } from "@/modules/trading/types";
import type { PortfolioBalanceDto } from "@/modules/wallet/types";

type UserEvents = {
  user_connected: (payload: { userId: string }) => void;
  auth_error: (payload: { message: string }) => void;
  order: (payload: OrderDto) => void;
  fill: (payload: FillDto) => void;
  balance: (payload: Omit<PortfolioBalanceDto, "id">) => void;
  notification: (payload: NotificationDto) => void;
};

export type UserStreamStatus = "idle" | "connecting" | "live" | "offline";

let status: UserStreamStatus = "idle";
const listeners = new Set<() => void>();
function setStatus(next: UserStreamStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach((l) => l());
}

export function useUserStreamStatus() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
    () => "idle" as UserStreamStatus,
  );
}

async function fetchSocketToken(): Promise<string | null> {
  try {
    const { token } = await apiGet<{ token: string }>("/auth/socket-token");
    return token;
  } catch {
    return null;
  }
}

/**
 * Private `/user` stream (REAL accounts): live order status, fills, balances
 * and notifications. Mount once in the app shell.
 */
export function useUserStream(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    setStatus("connecting");

    const socket: Socket<UserEvents> = io(`${env.backendHttpUrl}/user`, {
      transports: ["websocket"],
      // A fresh short-lived token on every (re)connect; the BFF refreshes it.
      auth: (cb) => {
        void fetchSocketToken().then((token) => cb({ token: token ?? "" }));
      },
      reconnectionDelay: 2_000,
      reconnectionDelayMax: 30_000,
    });

    socket.on("user_connected", () => setStatus("live"));
    socket.on("disconnect", () => setStatus("offline"));
    socket.on("auth_error", () => {
      setStatus("offline");
      // Token likely expired between fetch and handshake: retry once shortly.
      window.setTimeout(() => socket.connect(), 3_000);
    });

    socket.on("order", (order) => {
      void queryClient.invalidateQueries({
        queryKey: ["orders", order.accountId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["orders", "history", order.accountId],
      });
      const s = order.status.toUpperCase();
      if (
        s === "CANCELLED" &&
        order.statusReason &&
        order.statusReason !== "USER"
      ) {
        toast.error(
          `${order.side} ${order.symbol} cancelled: ${order.statusReason.replace(/_/g, " ").toLowerCase()}`,
          {
            id: `order-${order.id}`,
          },
        );
      }
    });

    socket.on("fill", (fill) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      // Same toast id as the order mutation so a taker fill doesn't double-toast.
      toast.success(
        `${fill.side === "BUY" ? "Bought" : "Sold"} ${fill.quantity} ${fill.symbol.split("-")[0]} @ ${formatFixed(fill.price, 2)}`,
        {
          id: `order-${fill.orderId}`,
          description: `${fill.liquidity === "MAKER" ? "Maker" : "Taker"} · fee ${fill.fee} ${fill.feeAsset}`,
        },
      );
    });

    socket.on("balance", (balance) => {
      queryClient.setQueryData<PortfolioBalanceDto[]>(
        ["wallet", "portfolio", balance.accountId],
        (current) => {
          if (!current) return current;
          const exists = current.some((b) => b.asset === balance.asset);
          const next = {
            ...balance,
            id: `${balance.accountId}-${balance.asset}`,
          };
          return exists
            ? current.map((b) =>
                b.asset === balance.asset ? { ...b, ...balance } : b,
              )
            : [...current, next];
        },
      );
    });

    socket.on("notification", (item) => {
      pushNotification(queryClient, item);
      if (item.type !== "ORDER_FILLED") {
        toast(item.title, { description: item.body });
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setStatus("idle");
    };
  }, [enabled, queryClient]);
}
