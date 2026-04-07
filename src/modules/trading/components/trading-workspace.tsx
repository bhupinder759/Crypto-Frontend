"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { MetricCard } from "@/components/common/metric-card";
import {
  useCandlesQuery,
  useInstrumentQuery,
  useOrderBookQuery,
  useSymbolsQuery,
  useTickerQuery,
  useTradesQuery,
} from "@/modules/market/hooks/use-market-data";
import { useReferenceMarketStream } from "@/modules/market/hooks/use-reference-market-stream";
import { MarketCalculatorCard } from "@/modules/trading/components/market-calculator-card";
import { MarketToolbar } from "@/modules/trading/components/market-toolbar";
import { OpenOrdersCard } from "@/modules/trading/components/open-orders-card";
import { OrderBookCard } from "@/modules/trading/components/order-book-card";
import { RecentTradesCard } from "@/modules/trading/components/recent-trades-card";
import { TradeForm } from "@/modules/trading/components/trade-form";
import { useCancelOrderMutation, useMarketRealtime, useOpenOrdersQuery } from "@/modules/trading/hooks/use-trading";
import type { AccountDto } from "@/modules/auth/types";

const MarketChart = dynamic(
  () => import("@/modules/trading/components/market-chart").then((mod) => mod.MarketChart),
  { ssr: false },
);

export function TradingWorkspace({
  symbol,
  account,
}: {
  symbol: string;
  account: AccountDto | null;
}) {
  const [interval, setInterval] = useState("1m");
  const symbolsQuery = useSymbolsQuery();
  const instrumentQuery = useInstrumentQuery(symbol);
  const tickerQuery = useTickerQuery(symbol);
  const tradesQuery = useTradesQuery(symbol);
  const candlesQuery = useCandlesQuery(symbol, interval);
  const orderBookQuery = useOrderBookQuery(symbol);
  const openOrdersQuery = useOpenOrdersQuery(account?.id, symbol);
  const cancelMutation = useCancelOrderMutation();
  const realtime = useMarketRealtime(symbol);
  const referenceRealtime = useReferenceMarketStream(symbol);

  const ticker = referenceRealtime.ticker ?? tickerQuery.data ?? null;
  const orderBook =
    realtime.orderBook ?? referenceRealtime.orderBook ?? orderBookQuery.data ?? null;
  const trades = useMemo(
    () =>
      realtime.trades.length > 0
        ? realtime.trades
        : referenceRealtime.trades.length > 0
          ? referenceRealtime.trades
          : tradesQuery.data ?? [],
    [realtime.trades, referenceRealtime.trades, tradesQuery.data],
  );
  const instrument = instrumentQuery.data ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Execution"
        title={`${symbol} Trading`}
        description="Execution workspace with exchange data, reference-market fallbacks, and live sizing calculations for crypto and FX majors."
      />
      <MarketToolbar
        symbol={symbol}
        symbols={symbolsQuery.data ?? [symbol]}
        interval={interval}
        onIntervalChange={setInterval}
        instrument={instrument}
      />
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <MetricCard
          title="Last Price"
          value={ticker?.lastPrice ?? "--"}
          delta={ticker?.priceChange24h}
          tone={Number(ticker?.priceChange24h ?? 0) >= 0 ? "positive" : "negative"}
        />
        <MetricCard title="24h High" value={ticker?.high24h ?? "--"} />
        <MetricCard title="24h Low" value={ticker?.low24h ?? "--"} />
        <MetricCard title="24h Volume" value={ticker?.volume24h ?? "--"} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <div className="space-y-6">
          <MarketChart candles={candlesQuery.data ?? []} />
          <OpenOrdersCard
            orders={openOrdersQuery.data ?? []}
            cancelling={cancelMutation.isPending}
            onCancel={(order) =>
              cancelMutation.mutate({ orderId: order.id, accountId: order.accountId })
            }
          />
        </div>
        <div className="grid gap-6">
          <MarketCalculatorCard symbol={symbol} instrument={instrument} ticker={ticker} />
          <TradeForm
            symbol={symbol}
            account={account}
            instrument={instrument}
            ticker={ticker}
            orderBook={orderBook}
          />
          <OrderBookCard orderBook={orderBook} />
          <RecentTradesCard trades={trades} />
        </div>
      </div>
    </div>
  );
}
