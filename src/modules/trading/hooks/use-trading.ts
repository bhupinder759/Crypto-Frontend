"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useOrderBookQuery,
  useTradesQuery,
} from "@/modules/market/hooks/use-market-data";
import {
  getSharedSocket,
  retainRoom,
  useMarketSocket,
} from "@/modules/market/hooks/use-market-socket";
import { useTickersStore } from "@/modules/market/store/tickers.store";
import {
  normalizeMarketTicker,
  normalizeOrderBook,
  normalizeTrades,
} from "@/modules/market/services/normalize";
import {
  cancelOrder,
  createOrder,
  getFeeSchedule,
  getFills,
  getOrder,
  getOrders,
} from "@/modules/trading/services/trading.api";
import { useTradingStore } from "@/modules/trading/store/trading.store";
import type { OrderDto, OrderFormInput } from "@/modules/trading/types";
import type { OrderBookDto, TradeDto } from "@/types/api.types";

const EMPTY_TRADES: TradeDto[] = [];

export const ordersKey = (accountId?: string, symbol?: string) =>
  ["orders", accountId, symbol] as const;

export function useOpenOrdersQuery(accountId?: string, symbol?: string) {
  return useQuery({
    queryKey: ordersKey(accountId, symbol),
    queryFn: () => getOrders({ accountId: accountId!, symbol, limit: 50 }),
    enabled: Boolean(accountId),
    refetchInterval: 15_000,
  });
}

const REASONS: Record<string, string> = {
  IOC_REMAINDER: "IOC remainder cancelled",
  INSUFFICIENT_LIQUIDITY: "not enough liquidity",
  BUDGET_EXHAUSTED: "budget used up",
  POST_ONLY_WOULD_TAKE: "post-only would take liquidity",
  FOK_NOT_FILLABLE: "FOK could not fill completely",
  SELF_TRADE_PREVENTION: "self-trade prevented",
};

function describeStatus(
  order: Pick<
    OrderDto,
    "status" | "side" | "quantity" | "symbol" | "statusReason"
  >,
) {
  const status = order.status.toUpperCase();
  const reason = order.statusReason ? REASONS[order.statusReason] : undefined;
  const label = `${order.side} ${order.quantity} ${order.symbol}${reason ? ` — ${reason}` : ""}`;
  if (status === "FILLED")
    return { kind: "success" as const, text: `Filled: ${label}` };
  if (status.startsWith("PARTIAL"))
    return { kind: "success" as const, text: `Partially filled: ${label}` };
  if (status === "REJECTED" || status === "FAILED")
    return { kind: "error" as const, text: `Rejected: ${label}` };
  if (status === "CANCELLED" || status === "CANCELED" || status === "EXPIRED")
    return {
      kind: "error" as const,
      text: `Not filled (${status.toLowerCase()}): ${label}`,
    };
  return { kind: "info" as const, text: `Order placed: ${label}` };
}

/**
 * Places an order with an optimistic row in the open-orders list, then reads
 * back the order status to toast fill / reject.
 */
export function useCreateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OrderFormInput) => createOrder(payload),
    onMutate: async (payload) => {
      const key = ordersKey(payload.accountId, payload.symbol);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<OrderDto[]>(key);
      const optimistic: OrderDto = {
        id: `pending-${payload.clientOrderId}`,
        accountId: payload.accountId,
        symbol: payload.symbol,
        side: payload.side,
        type: payload.type,
        price: payload.price ?? null,
        quantity: payload.quantity ?? "…",
        filled: "0",
        remaining: payload.quantity ?? "…",
        status: "PENDING",
        clientOrderId: payload.clientOrderId,
        timeInForce: payload.timeInForce,
        postOnly: payload.postOnly,
      };
      queryClient.setQueryData<OrderDto[]>(key, (current) => [
        optimistic,
        ...(current ?? []),
      ]);
      return { key, previous };
    },
    onError: (error, _payload, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous);
      toast.error(error.message || "Order rejected");
    },
    onSuccess: async (response, payload) => {
      const show = (order: Parameters<typeof describeStatus>[0]) => {
        const { kind, text } = describeStatus(order);
        const opts = { id: `order-${response.orderId}` };
        if (kind === "success") toast.success(text, opts);
        else if (kind === "error") toast.error(text, opts);
        else toast(text, opts);
      };
      // REAL accounts return the final status; demo needs a read-back.
      if (response.status) {
        show({
          status: response.status,
          side: payload.side,
          symbol: payload.symbol,
          quantity:
            payload.quantity ??
            `${payload.quoteOrderQty} ${payload.symbol.split("-")[1]} of`,
          statusReason: null,
        });
        return;
      }
      try {
        show(await getOrder(response.orderId));
      } catch {
        toast.success("Order submitted", { id: `order-${response.orderId}` });
      }
    },
    onSettled: (_response, _error, payload) => {
      void queryClient.invalidateQueries({
        queryKey: ["orders", payload.accountId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["orders", "history", payload.accountId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["wallet", "portfolio", payload.accountId],
      });
    },
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => toast.success("Order cancelled"),
    onError: (error) => toast.error(error.message || "Cancel failed"),
    onSettled: (_response, _error, payload) => {
      void queryClient.invalidateQueries({
        queryKey: ["orders", payload.accountId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["orders", "history", payload.accountId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["wallet", "portfolio", payload.accountId],
      });
    },
  });
}

/** Account fee schedule; DEMO accounts are fee-free in this exchange. */
export function useFeeSchedule(mode: "DEMO" | "REAL", accountId?: string) {
  return useQuery({
    queryKey: ["account", "fees", accountId],
    queryFn: getFeeSchedule,
    enabled: mode === "REAL" && Boolean(accountId),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/** Own executions (REAL only); DEMO falls back to filled orders in the UI. */
export function useFillsQuery(
  accountId: string | undefined,
  mode: "DEMO" | "REAL",
  symbol?: string,
) {
  return useQuery({
    queryKey: ["orders", accountId, "fills", symbol ?? "all"],
    queryFn: () => getFills({ accountId: accountId!, symbol, limit: 50 }),
    enabled: mode === "REAL" && Boolean(accountId),
    refetchInterval: 30_000,
  });
}

/** Toasts when a resting order gets (partially) filled between polls. */
export function useFillNotifications(orders: OrderDto[] | undefined) {
  const seen = useRef<Map<string, string> | null>(null);

  useEffect(() => {
    if (!orders) return;
    const previous = seen.current;
    const next = new Map<string, string>();
    for (const order of orders) {
      if (order.id.startsWith("pending-")) continue;
      next.set(order.id, order.filled);
      const before = previous?.get(order.id);
      if (
        previous &&
        before !== undefined &&
        Number(order.filled) > Number(before)
      ) {
        toast.success(describeStatus(order).text, { id: `order-${order.id}` });
      }
    }
    seen.current = next;
  }, [orders]);
}

/**
 * Wires the live Socket.IO streams for one market (engine `orderbook`,
 * upstream `live_orderbook`, `trades`, `ticker`) into the stores.
 * Call once per terminal.
 */
export function useMarketStreams(symbol: string, interval: string) {
  const setInternalOrderBook = useTradingStore((s) => s.setInternalOrderBook);
  const setExternalOrderBook = useTradingStore((s) => s.setExternalOrderBook);
  const prependTrades = useTradingStore((s) => s.prependTrades);
  const mergeTickers = useTickersStore((s) => s.merge);
  // Keeps the candle room joined (also joins the symbol room server-side).
  useMarketSocket(symbol, interval);

  useEffect(() => {
    if (!symbol) return;
    const socket = getSharedSocket();
    const release = retainRoom(
      `symbol:${symbol}`,
      (s) => s.emit("subscribe_symbol", { symbol }),
      (s) => s.emit("unsubscribe_symbol", { symbol }),
    );

    const onInternalBook = (payload: unknown) => {
      const book = normalizeOrderBook(payload);
      if (book && book.symbol === symbol) {
        setInternalOrderBook(symbol, { ...book, source: "internal" });
      }
    };
    const onExternalBook = (payload: unknown) => {
      const book = normalizeOrderBook(payload);
      if (book && book.symbol === symbol) {
        setExternalOrderBook(symbol, { ...book, source: "external" });
      }
    };
    const onTrades = (payload: unknown[]) => {
      const trades = normalizeTrades(payload).filter(
        (t) => !t.symbol || t.symbol === symbol,
      );
      // Server sends oldest → newest; the store keeps newest first.
      if (trades.length) prependTrades(symbol, trades.reverse());
    };
    const onTicker = (payload: unknown) => {
      const ticker = normalizeMarketTicker(payload);
      if (ticker && ticker.symbol === symbol) mergeTickers([ticker]);
    };

    socket.on("orderbook", onInternalBook);
    socket.on("live_orderbook", onExternalBook);
    socket.on("trades", onTrades);
    socket.on("ticker", onTicker);
    return () => {
      socket.off("orderbook", onInternalBook);
      socket.off("live_orderbook", onExternalBook);
      socket.off("trades", onTrades);
      socket.off("ticker", onTicker);
      release();
    };
  }, [
    mergeTickers,
    prependTrades,
    setExternalOrderBook,
    setInternalOrderBook,
    symbol,
  ]);
}

/** The exchange matching-engine book only (what REAL orders execute against). */
export function useEngineOrderBook(symbol: string): OrderBookDto | null {
  return useTradingStore((s) => s.realtimeBySymbol[symbol]?.internalOrderBook ?? null);
}

function hasLevels(book: OrderBookDto | null) {
  return Boolean(book && (book.bids.length > 0 || book.asks.length > 0));
}

/**
 * Book shown in the terminal: the exchange's own engine book when it has
 * liquidity (that is what orders match against), otherwise the upstream
 * reference book, otherwise the REST snapshot.
 */
export function useLiveOrderBook(symbol: string): OrderBookDto | null {
  const external = useTradingStore(
    (s) => s.realtimeBySymbol[symbol]?.externalOrderBook ?? null,
  );
  const internal = useTradingStore(
    (s) => s.realtimeBySymbol[symbol]?.internalOrderBook ?? null,
  );
  const query = useOrderBookQuery(symbol);
  if (hasLevels(internal)) return internal;
  if (hasLevels(external)) return external;
  if (hasLevels(query.data ?? null)) return query.data ?? null;
  return internal ?? external ?? query.data ?? null;
}

export function useLiveTrades(symbol: string) {
  const live = useTradingStore(
    (s) => s.realtimeBySymbol[symbol]?.trades ?? EMPTY_TRADES,
  );
  const query = useTradesQuery(symbol);
  const trades = useMemo(() => {
    const snapshot = query.data ?? EMPTY_TRADES;
    if (live.length === 0) return snapshot;
    const ids = new Set(live.map((t) => t.id));
    return [...live, ...snapshot.filter((t) => !ids.has(t.id))].slice(0, 60);
  }, [live, query.data]);
  return { trades, query };
}
