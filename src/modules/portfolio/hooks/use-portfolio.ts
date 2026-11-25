"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useMarketSummaries } from "@/modules/market/hooks/use-market-overview";
import { getCandlesPage } from "@/modules/market/services/market.api";
import { usePortfolioQuery } from "@/modules/wallet/hooks/use-wallet";
import {
  EQUITY_RANGES,
  buildEquityCurve,
  type EquityRange,
} from "@/modules/portfolio/services/equity-history";
import {
  valuePortfolio,
  type Holding,
} from "@/modules/portfolio/services/valuation";

export function usePortfolioOverview(accountId?: string) {
  const balancesQuery = usePortfolioQuery(accountId);
  const markets = useMarketSummaries();

  const valuation = useMemo(
    () => valuePortfolio(balancesQuery.data ?? [], markets.summaries),
    [balancesQuery.data, markets.summaries],
  );

  return {
    ...valuation,
    markets,
    balancesQuery,
    isLoading:
      balancesQuery.isLoading ||
      (Boolean(balancesQuery.data?.length) && markets.isLoading),
  };
}

export function useEquityHistory(holdings: Holding[], range: EquityRange) {
  const { interval, limit } = EQUITY_RANGES[range];
  const symbols = useMemo(
    () => holdings.filter((h) => h.symbol).map((h) => h.symbol!),
    [holdings],
  );

  const result = useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: [
        "market",
        "candles",
        "range",
        symbol,
        interval,
        limit,
      ] as const,
      queryFn: async () =>
        (await getCandlesPage(symbol, interval, limit)).items,
      staleTime: 60_000,
    })),
    combine: (results) => ({
      data: results.map((r) => r.data),
      isLoading: results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
    }),
  });

  const points = useMemo(() => {
    const bySymbol = Object.fromEntries(
      symbols.map((s, i) => [s, result.data[i]]),
    );
    return buildEquityCurve(holdings, bySymbol);
  }, [holdings, result.data, symbols]);

  return { points, isLoading: result.isLoading, isError: result.isError };
}
