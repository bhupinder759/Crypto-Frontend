"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getCandlesPage,
  getChartPreference,
  getInstruments,
  getOrderBook,
  getSymbols,
  getTicker,
  getTrades,
  updateChartPreference,
} from "@/modules/market/services/market.api";
import type {
  ChartDrawingConfig,
  ChartIndicatorConfig,
} from "@/modules/market/types/chart-workspace";

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
      return Array.isArray(instrument) ? (instrument[0] ?? null) : instrument;
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

export function useCandlesQuery(symbol: string, interval = "1m") {
  return useQuery({
    queryKey: ["market", "candles", symbol, interval],
    queryFn: async () => {
      const response = await getCandlesPage(symbol, interval, 120);
      return response.items;
    },
    enabled: Boolean(symbol),
    staleTime: 15_000,
  });
}

export function useInfiniteCandlesQuery(symbol: string, interval = "1m") {
  return useInfiniteQuery({
    queryKey: ["market", "candles", "infinite", symbol, interval],
    queryFn: ({ pageParam }) =>
      getCandlesPage(symbol, interval, 120, pageParam ?? undefined),
    enabled: Boolean(symbol),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextBeforeTimestamp : undefined,
    staleTime: 15_000,
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

export function useChartPreferenceQuery(
  symbol: string,
  interval: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["market", "chart-preference", symbol, interval],
    queryFn: () => getChartPreference(symbol, interval),
    enabled: enabled && Boolean(symbol && interval),
    staleTime: 60_000,
  });
}

export function useUpdateChartPreferenceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      symbol: string;
      interval: string;
      lastViewedTimestamp?: number;
      indicatorConfig?: ChartIndicatorConfig[];
      drawingConfig?: ChartDrawingConfig[];
    }) => updateChartPreference(payload),
    onSuccess: (response) => {
      queryClient.setQueryData(
        ["market", "chart-preference", response.symbol, response.interval],
        response,
      );
    },
  });
}
