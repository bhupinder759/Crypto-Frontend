"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { PageHeader } from "@/components/common/page-header";
import { MetricCard } from "@/components/common/metric-card";
import {
  useCandlesQuery,
  useInstrumentQuery,
  useOrderBookQuery,
  useTickerQuery,
  useTradesQuery,
} from "@/modules/market/hooks/use-market-data";
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
  const instrumentQuery = useInstrumentQuery(symbol);
  const tickerQuery = useTickerQuery(symbol);
  const tradesQuery = useTradesQuery(symbol);
  const candlesQuery = useCandlesQuery(symbol);
  const orderBookQuery = useOrderBookQuery(symbol);
  const openOrdersQuery = useOpenOrdersQuery(account?.id, symbol);
  const cancelMutation = useCancelOrderMutation();
  const realtime = useMarketRealtime(symbol);

  const orderBook = realtime.orderBook ?? orderBookQuery.data ?? null;
  const trades = useMemo(
    () => (realtime.trades.length > 0 ? realtime.trades : tradesQuery.data ?? []),
    [realtime.trades, tradesQuery.data],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Execution"
        title={`${symbol} Trading`}
        description="Live order book, market trades, charting, and order entry connected to backend exchange services."
      />
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <MetricCard
          title="Last Price"
          value={tickerQuery.data?.lastPrice ?? "--"}
          delta={tickerQuery.data?.priceChange24h}
          tone={Number(tickerQuery.data?.priceChange24h ?? 0) >= 0 ? "positive" : "negative"}
        />
        <MetricCard title="24h High" value={tickerQuery.data?.high24h ?? "--"} />
        <MetricCard title="24h Low" value={tickerQuery.data?.low24h ?? "--"} />
        <MetricCard title="24h Volume" value={tickerQuery.data?.volume24h ?? "--"} />
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
          <TradeForm
            symbol={symbol}
            account={account}
            instrument={instrumentQuery.data ?? null}
            ticker={tickerQuery.data ?? null}
            orderBook={orderBook}
          />
          <OrderBookCard orderBook={orderBook} />
          <RecentTradesCard trades={trades} />
        </div>
      </div>
    </div>
  );
}
