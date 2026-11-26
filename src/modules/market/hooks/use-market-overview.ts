"use client";

import { useEffect, useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/api-client";
import { useSymbolsQuery } from "@/modules/market/hooks/use-market-data";
import { getSharedSocket, retainRoom } from "@/modules/market/hooks/use-market-socket";
import {
  buildMarketSummary,
  type MarketSummary,
} from "@/modules/market/services/market-overview";
import { getCandlesPage } from "@/modules/market/services/market.api";
import { normalizeMarketTicker } from "@/modules/market/services/normalize";
import { useTickersStore } from "@/modules/market/store/tickers.store";
import type { MarketTickerDto } from "@/types/api.types";

const SPARKLINE_INTERVAL = "1h";
const SPARKLINE_POINTS = 168; // 7 days of hourly closes

/** Hourly candles for a symbol (7d) — sparklines and 24h fallbacks. */
export const sparklineQuery = (symbol: string) => ({
  queryKey: ["market", "sparkline", symbol] as const,
  queryFn: async () =>
    (await getCandlesPage(symbol, SPARKLINE_INTERVAL, SPARKLINE_POINTS)).items,
  staleTime: 10 * 60_000,
  refetchInterval: 10 * 60_000,
});

function toTickers(raw: unknown): MarketTickerDto[] {
  return (Array.isArray(raw) ? raw : [raw])
    .map(normalizeMarketTicker)
    .filter((t): t is MarketTickerDto => t !== null);
}

let listenersWired = false;
function wireTickerListeners() {
  if (listenersWired) return;
  listenersWired = true;
  const socket = getSharedSocket();
  const merge = useTickersStore.getState().merge;
  socket.on("tickers", (payload) => merge(toTickers(payload)));
  socket.on("ticker", (payload) => merge(toTickers(payload)));
}

/** Live tickers for every symbol: one REST snapshot, then Socket.IO deltas. */
export function useLiveTickers() {
  const merge = useTickersStore((s) => s.merge);
  useQuery({
    queryKey: ["market", "tickers"],
    queryFn: async () => {
      const list = toTickers(await apiGet<unknown>("/market/tickers"));
      merge(list);
      return list;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    wireTickerListeners();
    return retainRoom(
      "tickers",
      (socket) => socket.emit("subscribe_tickers"),
      (socket) => socket.emit("unsubscribe_tickers"),
    );
  }, []);

  return useTickersStore((s) => s.bySymbol);
}

/** One summary per listed symbol, driven by the live ticker stream. */
export function useMarketSummaries(only?: string[]) {
  const symbolsQuery = useSymbolsQuery();
  const tickers = useLiveTickers();
  const symbols = useMemo(() => {
    const all = symbolsQuery.data ?? [];
    return only ? all.filter((s) => only.includes(s)) : all;
  }, [only, symbolsQuery.data]);

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
        buildMarketSummary(symbol, tickers[symbol], candles.data[index]),
      ),
    [candles.data, symbols, tickers],
  );

  return {
    summaries,
    isLoading:
      symbolsQuery.isLoading ||
      (summaries.length > 0 && summaries.every((s) => s.last == null) && candles.loading),
    isError: symbolsQuery.isError,
    error: symbolsQuery.error,
    refetch: symbolsQuery.refetch,
  };
}
