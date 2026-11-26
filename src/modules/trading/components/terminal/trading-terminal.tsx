"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { decimalsFromIncrement } from "@/lib/utils/precision";
import type { AccountDto } from "@/modules/auth/types";
import { LiveCandlestickChart } from "@/modules/market/components/live-candlestick-chart";
import { useInstrumentQuery } from "@/modules/market/hooks/use-market-data";
import type { MarketData } from "@/modules/market/types/market-data";
import { useMarketStreams } from "@/modules/trading/hooks/use-trading";
import { useTicketStore } from "@/modules/trading/store/ticket.store";
import { useTradingStore } from "@/modules/trading/store/trading.store";
import { OrderBook } from "./order-book";
import { OrdersPanel } from "./orders-panel";
import { RecentTrades } from "./recent-trades";
import { SymbolBar } from "./symbol-bar";
import { TradeTicket } from "./trade-ticket";

const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"];

function Pane({
  title,
  children,
  className,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex h-full min-h-0 flex-col bg-card", className)}>
      {title ? (
        <header className="flex h-8 shrink-0 items-center border-b border-border px-2 text-xs font-medium">
          {title}
        </header>
      ) : null}
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

function IntervalPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="radiogroup"
      aria-label="Interval"
    >
      {INTERVALS.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "rounded px-1.5 py-0.5 text-[11px] font-medium",
            value === option
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function BookAndTrades({
  symbol,
  instrument,
  stacked,
}: {
  symbol: string;
  instrument: ReturnType<typeof useInstrumentQuery>["data"];
  stacked: boolean;
}) {
  if (stacked) {
    return (
      <ResizablePanelGroup orientation="vertical">
        <ResizablePanel defaultSize="62%" minSize="30%">
          <Pane title="Order book">
            <OrderBook symbol={symbol} instrument={instrument ?? null} />
          </Pane>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="38%" minSize="15%">
          <Pane title="Recent trades">
            <RecentTrades symbol={symbol} instrument={instrument ?? null} />
          </Pane>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }
  return (
    <Tabs
      defaultValue="book"
      className="flex h-full min-h-0 flex-col gap-0 bg-card"
    >
      <TabsList
        variant="line"
        className="h-8 w-full justify-start border-b border-border px-2"
      >
        <TabsTrigger value="book" className="flex-none text-xs">
          Order book
        </TabsTrigger>
        <TabsTrigger value="trades" className="flex-none text-xs">
          Trades
        </TabsTrigger>
      </TabsList>
      <TabsContent value="book" className="min-h-0 flex-1">
        <OrderBook symbol={symbol} instrument={instrument ?? null} />
      </TabsContent>
      <TabsContent value="trades" className="min-h-0 flex-1">
        <RecentTrades symbol={symbol} instrument={instrument ?? null} />
      </TabsContent>
    </Tabs>
  );
}

export function TradingTerminal({
  symbol,
  account,
}: {
  symbol: string;
  account: AccountDto | null;
}) {
  const [interval, setInterval] = useState("1m");
  const instrumentQuery = useInstrumentQuery(symbol);
  const instrument = instrumentQuery.data ?? null;
  const priceDecimals = decimalsFromIncrement(instrument?.priceIncrement, 2);
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  const isWide = useMediaQuery("(min-width: 1440px)", true);
  const setLastCandle = useTradingStore((s) => s.setLastCandle);

  useMarketStreams(symbol, interval);

  useEffect(() => {
    void useTicketStore.persist.rehydrate();
  }, []);

  const onLiveCandle = useCallback(
    (candle: MarketData) => setLastCandle(symbol, candle),
    [setLastCandle, symbol],
  );

  const chart = (
    <LiveCandlestickChart
      key={`${symbol}:${interval}`}
      symbol={symbol}
      interval={interval}
      bare
      onLiveCandle={onLiveCandle}
      toolbar={<IntervalPicker value={interval} onChange={setInterval} />}
    />
  );
  const ticket = (
    <TradeTicket symbol={symbol} account={account} instrument={instrument} />
  );
  const orders = (
    <OrdersPanel
      symbol={symbol}
      account={account}
      priceDecimals={priceDecimals}
    />
  );

  return (
    <div className="-mx-3 -my-4 flex flex-col lg:-mx-4">
      <SymbolBar symbol={symbol} priceDecimals={priceDecimals} />
      {isDesktop ? (
        <div className="h-[calc(100svh-3rem-2.75rem-1.75rem)] min-h-[640px]">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize="72%" minSize="45%">
              <ResizablePanelGroup orientation="horizontal">
                <ResizablePanel
                  defaultSize={isWide ? "58%" : "52%"}
                  minSize="30%"
                >
                  <Pane>{chart}</Pane>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel
                  defaultSize={isWide ? "22%" : "26%"}
                  minSize="16%"
                >
                  <BookAndTrades
                    symbol={symbol}
                    instrument={instrument}
                    stacked={isWide}
                  />
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize="20%" minSize="16%">
                  <Pane title="Place order" className="overflow-y-auto">
                    {ticket}
                  </Pane>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize="28%" minSize="12%">
              <Pane>{orders}</Pane>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      ) : (
        <div className="flex flex-col">
          <Tabs defaultValue="chart" className="gap-0">
            <TabsList
              variant="line"
              className="h-9 w-full border-b border-border px-2"
            >
              <TabsTrigger value="chart" className="text-xs">
                Chart
              </TabsTrigger>
              <TabsTrigger value="book" className="text-xs">
                Book
              </TabsTrigger>
              <TabsTrigger value="trades" className="text-xs">
                Trades
              </TabsTrigger>
              <TabsTrigger value="trade" className="text-xs">
                Trade
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chart" className="h-[420px] flex-none bg-card">
              {chart}
            </TabsContent>
            <TabsContent value="book" className="h-[460px] flex-none bg-card">
              <OrderBook symbol={symbol} instrument={instrument} />
            </TabsContent>
            <TabsContent value="trades" className="h-[460px] flex-none bg-card">
              <RecentTrades symbol={symbol} instrument={instrument} />
            </TabsContent>
            <TabsContent value="trade" className="flex-none bg-card">
              {ticket}
            </TabsContent>
          </Tabs>
          <div className="h-[320px] border-t border-border bg-card">
            {orders}
          </div>
        </div>
      )}
    </div>
  );
}
