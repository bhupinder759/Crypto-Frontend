"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { socketClient } from "@/lib/websocket/socketClient";
import { useTradingStore } from "@/modules/trading/store/trading.store";
import { cancelOrder, createOrder, getOrders } from "@/modules/trading/services/trading.api";
import type { OrderFormInput } from "@/modules/trading/types";
import type { OrderBookDto, TradeDto } from "@/types/api.types";

const EMPTY_TRADES: TradeDto[] = [];

export function useOpenOrdersQuery(accountId?: string, symbol?: string) {
  return useQuery({
    queryKey: ["orders", accountId, symbol],
    queryFn: () =>
      getOrders({
        accountId: accountId!,
        symbol,
        limit: 20,
      }),
    enabled: Boolean(accountId),
    refetchInterval: 12_000,
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrderFormInput) => createOrder(payload),
    onSuccess: (_response, payload) => {
      queryClient.invalidateQueries({ queryKey: ["orders", payload.accountId] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "portfolio", payload.accountId] });
      toast.success("Order submitted");
    },
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: (_response, payload) => {
      queryClient.invalidateQueries({ queryKey: ["orders", payload.accountId] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "portfolio", payload.accountId] });
      toast.success("Order cancelled");
    },
  });
}

export function useMarketRealtime(symbol: string) {
  const orderBook = useTradingStore(
    (state) => state.realtimeBySymbol[symbol]?.orderBook ?? null,
  );
  const trades = useTradingStore(
    (state) => state.realtimeBySymbol[symbol]?.trades ?? EMPTY_TRADES,
  );
  const setOrderBook = useTradingStore((state) => state.setOrderBook);
  const prependTrade = useTradingStore((state) => state.prependTrade);

  useEffect(() => {
    if (!symbol) {
      return;
    }

    const unsubscribeOrderBook = socketClient.subscribe(
      `orderbook:${symbol}`,
      (payload) => {
        setOrderBook(symbol, payload as OrderBookDto);
      },
    );
    const unsubscribeTrades = socketClient.subscribe(`trades:${symbol}`, (payload) => {
      const data = payload as Omit<TradeDto, "id"> & { tradeId?: string };
      prependTrade(symbol, {
        id: data.tradeId ?? `${data.buyOrderId}-${data.sellOrderId}-${data.timestamp}`,
        symbol: data.symbol,
        price: data.price,
        quantity: data.quantity,
        buyOrderId: data.buyOrderId,
        sellOrderId: data.sellOrderId,
        timestamp: String(data.timestamp),
      });
    });

    return () => {
      unsubscribeOrderBook();
      unsubscribeTrades();
    };
  }, [prependTrade, setOrderBook, symbol]);

  return { orderBook, trades };
}
