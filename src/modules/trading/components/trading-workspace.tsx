"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useMarketSocket as useSocketIoMarketSocket } from "@/modules/market/hooks/use-market-socket";
import { LiveCandlestickChart } from "@/modules/market/components/live-candlestick-chart";
import { MarketCalculatorCard } from "@/modules/trading/components/market-calculator-card";
import { MarketToolbar } from "@/modules/trading/components/market-toolbar";
import { OpenOrdersCard } from "@/modules/trading/components/open-orders-card";
import { OrderBookCard } from "@/modules/trading/components/order-book-card";
import { RecentTradesCard } from "@/modules/trading/components/recent-trades-card";
import { TradeForm } from "@/modules/trading/components/trade-form";
import {
  useCancelOrderMutation,
  useMarketRealtime,
  useOpenOrdersQuery,
} from "@/modules/trading/hooks/use-trading";
import { useTradingStore } from "@/modules/trading/store/trading.store";
import type { AccountDto } from "@/modules/auth/types";
import type { MarketData } from "@/modules/market/types/market-data";
import type { OrderBookDto, TickerDto } from "@/types/api.types";

export function TradingWorkspace({
  symbol,
  account,
}: {
  symbol: string;
  account: AccountDto | null;
}) {
  const [interval, setInterval] = useState("1m");
  const [liveCandle, setLiveCandle] = useState<MarketData | null>(null);
  const symbolsQuery = useSymbolsQuery();
  const instrumentQuery = useInstrumentQuery(symbol);
  const tickerQuery = useTickerQuery(symbol);
  const tradesQuery = useTradesQuery(symbol);
  const orderBookQuery = useOrderBookQuery(symbol);
  const candlesQuery = useCandlesQuery(symbol, interval);
  const openOrdersQuery = useOpenOrdersQuery(account?.id, symbol);
  const cancelMutation = useCancelOrderMutation();
  const realtime = useMarketRealtime(symbol);
  const setExternalOrderBook = useTradingStore(
    (state) => state.setExternalOrderBook,
  );
  const { socketRef } = useSocketIoMarketSocket(symbol, interval);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    const handleOrderBook = (payload: OrderBookDto) => {
      if (payload.symbol !== symbol) {
        return;
      }

      setExternalOrderBook(symbol, payload);
    };

    socket.on("live_orderbook", handleOrderBook);

    return () => {
      socket.off("live_orderbook", handleOrderBook);
    };
  }, [setExternalOrderBook, socketRef, symbol]);

  const latestHistoricalCandle = useMemo(() => {
    const candles = candlesQuery.data ?? [];
    if (candles.length === 0) {
      return null;
    }

    return candles.reduce<MarketData | null>((latest, candle) => {
      if (!latest || candle.time > latest.time) {
        return candle;
      }

      return latest;
    }, null);
  }, [candlesQuery.data]);

  const activeCandle =
    liveCandle?.symbol === symbol && liveCandle.interval === interval
      ? liveCandle
      : latestHistoricalCandle;

  const ticker = useMemo<TickerDto | null>(() => {
    if (!tickerQuery.data && !activeCandle) {
      return null;
    }

    if (!activeCandle) {
      return tickerQuery.data ?? null;
    }

    const fallback = tickerQuery.data;
    const lastPrice = activeCandle.close.toString();
    const high24h = fallback
      ? Math.max(Number(fallback.high24h), activeCandle.high).toString()
      : activeCandle.high.toString();
    const low24h = fallback
      ? Math.min(Number(fallback.low24h), activeCandle.low).toString()
      : activeCandle.low.toString();

    return {
      symbol,
      lastPrice,
      high24h,
      low24h,
      volume24h: fallback?.volume24h ?? activeCandle.volume.toString(),
      priceChange24h: fallback?.priceChange24h ?? "0",
    };
  }, [activeCandle, symbol, tickerQuery.data]);

  const orderBook =
    realtime.externalOrderBook ??
    realtime.internalOrderBook ??
    orderBookQuery.data ??
    null;
  const trades = useMemo(
    () =>
      realtime.trades.length > 0 ? realtime.trades : (tradesQuery.data ?? []),
    [realtime.trades, tradesQuery.data],
  );
  const instrument = instrumentQuery.data ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Execution"
        title={`${symbol} Trading`}
        description="Execution workspace with backend market data, live candle updates, and real-time sizing calculations."
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
          tone={
            Number(ticker?.priceChange24h ?? 0) >= 0 ? "positive" : "negative"
          }
        />
        <MetricCard title="24h High" value={ticker?.high24h ?? "--"} />
        <MetricCard title="24h Low" value={ticker?.low24h ?? "--"} />
        <MetricCard title="24h Volume" value={ticker?.volume24h ?? "--"} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <div className="space-y-6">
          <LiveCandlestickChart
            key={`${symbol}:${interval}`}
            symbol={symbol}
            interval={interval}
            onLiveCandle={setLiveCandle}
          />
          <OpenOrdersCard
            orders={openOrdersQuery.data ?? []}
            cancelling={cancelMutation.isPending}
            onCancel={(order) =>
              cancelMutation.mutate({
                orderId: order.id,
                accountId: order.accountId,
              })
            }
          />
        </div>
        <div className="grid gap-6">
          <MarketCalculatorCard
            key={symbol}
            symbol={symbol}
            instrument={instrument}
            ticker={ticker}
          />
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
