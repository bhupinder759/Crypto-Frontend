"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSymbolsQuery } from "@/modules/market/hooks/use-market-data";
import {
  buildMarketSummary,
  type MarketSummary,
} from "@/modules/market/services/market-overview";
import {
  getCandlesPage,
  getTicker,
} from "@/modules/market/services/market.api";

const SPARKLINE_INTERVAL = "1h";
const SPARKLINE_POINTS = 168; // 7 days of hourly closes

/** Hourly candles for a symbol (7d) — shared by sparklines and 24h fallbacks. */
export const sparklineQuery = (symbol: string) => ({
  queryKey: ["market", "sparkline", symbol] as const,
  queryFn: async () =>
    (await getCandlesPage(symbol, SPARKLINE_INTERVAL, SPARKLINE_POINTS)).items,
  staleTime: 5 * 60_000,
  refetchInterval: 10 * 60_000,
});

export const tickerQuery = (symbol: string) => ({
  queryKey: ["market", "ticker", symbol] as const,
  queryFn: () => getTicker(symbol),
  refetchInterval: 60_000,
});

/**
 * One summary per listed symbol. Polls tickers (15s) and hourly candles (5m);
 * swap for the backend ticker stream when available.
 */
export function useMarketSummaries(only?: string[]) {
  const symbolsQuery = useSymbolsQuery();
  const symbols = useMemo(() => {
    const all = symbolsQuery.data ?? [];
    return only ? all.filter((s) => only.includes(s)) : all;
  }, [only, symbolsQuery.data]);

  const tickers = useQueries({
    queries: symbols.map((symbol) => tickerQuery(symbol)),
    combine: (results) => results.map((r) => r.data),
  });
  const candles = useQueries({
    queries: symbols.map((symbol) => sparklineQuery(symbol)),
    combine: (results) => ({
      data: results.map((r) => r.data),
      loading: results.some((r) => r.isLoading),
    }),
  });

  const summaries = useMemo<MarketSummary[]>(
    () =>
      symbols.map((symbol, index) =>
        buildMarketSummary(symbol, tickers[index], candles.data[index]),
      ),
    [candles.data, symbols, tickers],
  );

  return {
    summaries,
    isLoading:
      symbolsQuery.isLoading ||
      (summaries.length > 0 &&
        candles.loading &&
        summaries.every((s) => s.last == null)),
    isError: symbolsQuery.isError,
    error: symbolsQuery.error,
    refetch: symbolsQuery.refetch,
  };
}
