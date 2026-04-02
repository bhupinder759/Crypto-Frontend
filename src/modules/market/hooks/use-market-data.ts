"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCandles,
  getInstruments,
  getOrderBook,
  getSymbols,
  getTicker,
  getTrades,
} from "@/modules/market/services/market.api";

export function useSymbolsQuery() {
  return useQuery({
    queryKey: ["market", "symbols"],
    queryFn: getSymbols,
    staleTime: 60_000,
  });
}

export function useTickerQuery(symbol: string) {
  return useQuery({
    queryKey: ["market", "ticker", symbol],
    queryFn: () => getTicker(symbol),
    enabled: Boolean(symbol),
    refetchInterval: 15_000,
  });
}

export function useInstrumentQuery(symbol: string) {
  return useQuery({
    queryKey: ["market", "instrument", symbol],
    queryFn: async () => {
      const instrument = await getInstruments(symbol);
      return Array.isArray(instrument) ? instrument[0] ?? null : instrument;
    },
    enabled: Boolean(symbol),
    staleTime: 60_000,
  });
}

export function useTradesQuery(symbol: string) {
  return useQuery({
    queryKey: ["market", "trades", symbol],
    queryFn: () => getTrades(symbol),
    enabled: Boolean(symbol),
    refetchInterval: 15_000,
  });
}

export function useCandlesQuery(symbol: string) {
  return useQuery({
    queryKey: ["market", "candles", symbol],
    queryFn: () => getCandles(symbol),
    enabled: Boolean(symbol),
    refetchInterval: 30_000,
  });
}

export function useOrderBookQuery(symbol: string) {
  return useQuery({
    queryKey: ["market", "orderbook", symbol],
    queryFn: () => getOrderBook(symbol),
    enabled: Boolean(symbol),
    refetchInterval: 10_000,
  });
}
