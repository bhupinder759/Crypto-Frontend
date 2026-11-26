/**
 * Portfolio valuation from balances × market prices.
 *
 * No cost basis exists yet (needs fills, backend 2.3), so PnL here is the 24h
 * mark-to-market change of current holdings. Swap in realised/unrealised PnL
 * when fills are available.
 */
import type { MarketSummary } from "@/modules/market/services/market-overview";
import type { PortfolioBalanceDto } from "@/modules/wallet/types";

export const CASH_ASSETS = new Set(["USD", "USDT", "USDC"]);

export type Holding = {
  asset: string;
  /** Market used to price the asset (e.g. BTC-USD); null for cash. */
  symbol: string | null;
  amount: number;
  available: number;
  reserved: number;
  price: number | null;
  valueUsd: number;
  change24hUsd: number;
  changePct24h: number | null;
  allocationPct: number;
  sparkline: number[];
};

export type PortfolioTotals = {
  equityUsd: number;
  change24hUsd: number;
  changePct24h: number | null;
  cashUsd: number;
  unpricedAssets: string[];
};

function findMarket(asset: string, markets: MarketSummary[]) {
  return (
    markets.find((m) => m.base === asset && CASH_ASSETS.has(m.quote)) ?? null
  );
}

export function valuePortfolio(
  balances: PortfolioBalanceDto[],
  markets: MarketSummary[],
): { holdings: Holding[]; totals: PortfolioTotals } {
  const unpricedAssets: string[] = [];
  const rows = balances
    .map((balance) => {
      const amount =
        Number(balance.total ?? 0) ||
        Number(balance.available) + Number(balance.reserved);
      const asset = balance.asset.toUpperCase();
      const cash = CASH_ASSETS.has(asset);
      const market = cash ? null : findMarket(asset, markets);
      const price = cash ? 1 : (market?.last ?? null);
      if (!cash && price == null && amount > 0) unpricedAssets.push(asset);
      const valueUsd = price != null ? amount * price : 0;
      const change24hUsd =
        !cash && market?.change24h != null ? amount * market.change24h : 0;
      return {
        asset,
        symbol: market?.symbol ?? null,
        amount,
        available: Number(balance.available ?? 0),
        reserved: Number(balance.reserved ?? 0),
        price,
        valueUsd,
        change24hUsd,
        changePct24h: cash ? 0 : (market?.changePct24h ?? null),
        allocationPct: 0,
        sparkline: market?.sparkline ?? [],
      } satisfies Holding;
    })
    .filter((h) => h.amount > 0);

  const equityUsd = rows.reduce((sum, h) => sum + h.valueUsd, 0);
  const change24hUsd = rows.reduce((sum, h) => sum + h.change24hUsd, 0);
  const cashUsd = rows
    .filter((h) => h.symbol == null && h.price === 1)
    .reduce((s, h) => s + h.valueUsd, 0);
  const startEquity = equityUsd - change24hUsd;

  const holdings = rows
    .map((h) => ({
      ...h,
      allocationPct: equityUsd > 0 ? (h.valueUsd / equityUsd) * 100 : 0,
    }))
    .sort((a, b) => b.valueUsd - a.valueUsd);

  return {
    holdings,
    totals: {
      equityUsd,
      change24hUsd,
      changePct24h: startEquity > 0 ? (change24hUsd / startEquity) * 100 : null,
      cashUsd,
      unpricedAssets,
    },
  };
}
