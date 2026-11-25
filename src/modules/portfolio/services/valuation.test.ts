import { describe, expect, it } from "vitest";
import type { MarketSummary } from "@/modules/market/services/market-overview";
import { buildEquityCurve } from "./equity-history";
import { valuePortfolio } from "./valuation";

function market(symbol: string, last: number, change: number): MarketSummary {
  const [base, quote] = symbol.split("-") as [string, string];
  return {
    symbol,
    base,
    quote,
    last,
    change24h: change,
    changePct24h: (change / (last - change)) * 100,
    high24h: null,
    low24h: null,
    volume24h: null,
    quoteVolume24h: null,
    sparkline: [],
    source: "ticker",
  };
}

const balance = (asset: string, available: string, reserved = "0") => ({
  id: asset,
  accountId: "a",
  asset,
  available,
  reserved,
  total: String(Number(available) + Number(reserved)),
});

const markets = [market("BTC-USD", 60000, 1000), market("ETH-USD", 3000, -100)];

describe("valuePortfolio", () => {
  it("values holdings in USD and computes allocation + 24h change", () => {
    const { holdings, totals } = valuePortfolio(
      [balance("USD", "1000"), balance("BTC", "0.5"), balance("ETH", "1", "1")],
      markets,
    );
    expect(totals.equityUsd).toBe(1000 + 30000 + 6000);
    expect(totals.cashUsd).toBe(1000);
    expect(totals.change24hUsd).toBe(500 - 200);
    expect(totals.changePct24h).toBeCloseTo((300 / (37000 - 300)) * 100);
    expect(holdings.map((h) => h.asset)).toEqual(["BTC", "ETH", "USD"]);
    expect(holdings.reduce((s, h) => s + h.allocationPct, 0)).toBeCloseTo(100);
    expect(holdings.find((h) => h.asset === "ETH")?.reserved).toBe(1);
  });

  it("drops zero balances and reports unpriced assets", () => {
    const { holdings, totals } = valuePortfolio([balance("DOGE", "10"), balance("SOL", "0")], markets);
    expect(holdings.map((h) => h.asset)).toEqual(["DOGE"]);
    expect(totals.unpricedAssets).toEqual(["DOGE"]);
    expect(totals.equityUsd).toBe(0);
    expect(totals.changePct24h).toBeNull();
  });
});

describe("buildEquityCurve", () => {
  it("sums holdings × closes plus cash and forward-fills gaps", () => {
    const { holdings } = valuePortfolio([balance("USD", "100"), balance("BTC", "1"), balance("ETH", "2")], markets);
    const candle = (symbol: string, time: number, close: number) => ({
      symbol,
      interval: "1h",
      time,
      open: close,
      high: close,
      low: close,
      close,
      volume: 0,
      provider: "binance" as const,
      marketType: "crypto" as const,
      isClosed: true,
      eventTime: 0,
    });
    const curve = buildEquityCurve(holdings, {
      "BTC-USD": [candle("BTC-USD", 1, 50000), candle("BTC-USD", 2, 51000)],
      "ETH-USD": [candle("ETH-USD", 1, 2000)],
    });
    expect(curve).toEqual([
      { time: 1, equity: 100 + 50000 + 4000 },
      { time: 2, equity: 100 + 51000 + 4000 },
    ]);
  });
});
