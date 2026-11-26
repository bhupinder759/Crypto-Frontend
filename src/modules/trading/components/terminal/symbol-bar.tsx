"use client";

import { memo, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ChevronDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFlash } from "@/lib/hooks/use-flash";
import { cn } from "@/lib/utils";
import { formatCompact } from "@/lib/utils/formatter";
import { formatFixed } from "@/lib/utils/precision";
import { routes } from "@/lib/constants/routes";
import { useSymbolsQuery } from "@/modules/market/hooks/use-market-data";
import { useLiveTickers } from "@/modules/market/hooks/use-market-overview";
import { useTradingStore } from "@/modules/trading/store/trading.store";

function PairSwitcher({ symbol }: { symbol: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const symbolsQuery = useSymbolsQuery();
  const [base, quote] = symbol.split("-");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-accent"
          aria-label="Switch market"
        >
          <span className="text-base font-semibold">{base}</span>
          <span className="text-sm text-muted-foreground">/{quote}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Search pair…" />
          <CommandList>
            <CommandEmpty>
              {symbolsQuery.isError
                ? "Markets unavailable"
                : symbolsQuery.isLoading
                  ? "Loading…"
                  : "No pair found."}
            </CommandEmpty>
            <CommandGroup>
              {(symbolsQuery.data ?? []).map((item) => {
                const [b, q] = item.split("-");
                return (
                  <CommandItem
                    key={item}
                    value={item}
                    onSelect={() => {
                      setOpen(false);
                      router.push(`${routes.trading}/${item}` as Route);
                    }}
                    data-checked={item === symbol}
                  >
                    <span className="font-medium">{b}</span>
                    <span className="text-muted-foreground">/{q}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const LastPrice = memo(function LastPrice({
  price,
  decimals,
}: {
  price: number | null;
  decimals: number;
}) {
  const ref = useFlash<HTMLSpanElement>(price);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const [prev, setPrev] = useState(price);
  if (price !== prev) {
    // Derive direction during render (no effect) when the price changes.
    if (price != null && prev != null)
      setDirection(price > prev ? "up" : "down");
    setPrev(price);
  }

  return (
    <span
      ref={ref}
      className={cn(
        "rounded px-1 text-lg font-semibold tabular transition-colors",
        direction === "up" && "text-buy",
        direction === "down" && "text-sell",
      )}
    >
      {formatFixed(price, decimals)}
    </span>
  );
});

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-medium tabular", className)}>
        {value}
      </span>
    </div>
  );
}

export function SymbolBar({
  symbol,
  priceDecimals,
}: {
  symbol: string;
  priceDecimals: number;
}) {
  const ticker = useLiveTickers()[symbol];
  const lastCandle = useTradingStore(
    (s) => s.realtimeBySymbol[symbol]?.lastCandle ?? null,
  );

  const stats = useMemo(() => {
    // Newest of the live ticker and the live candle wins (either stream can lag).
    const candleIsNewer =
      lastCandle != null && (!ticker || (lastCandle.eventTime ?? 0) > ticker.eventTime);
    const last = candleIsNewer
      ? Number(lastCandle.close)
      : ticker
        ? Number(ticker.lastPrice)
        : null;
    const high = Math.max(Number(ticker?.high24h ?? 0), lastCandle?.high ?? 0);
    const lowCandidates = [Number(ticker?.low24h), lastCandle?.low].filter(
      (v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0,
    );
    const changeAbs = Number(ticker?.priceChange24h ?? 0);
    const changePct = Number(ticker?.priceChangePercent24h ?? 0);
    return {
      last,
      high: high > 0 ? high : null,
      low: lowCandidates.length ? Math.min(...lowCandidates) : null,
      changeAbs,
      changePct,
      volume: ticker?.volume24h ?? null,
    };
  }, [lastCandle, ticker]);

  const changeTone = stats.changeAbs >= 0 ? "text-buy" : "text-sell";
  const sign = stats.changeAbs > 0 ? "+" : "";

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border bg-card px-2 py-1.5">
      <PairSwitcher symbol={symbol} />
      <LastPrice price={stats.last} decimals={priceDecimals} />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <Stat
          label="24h change"
          className={changeTone}
          value={
            ticker
              ? `${sign}${formatFixed(stats.changeAbs, priceDecimals)} (${sign}${stats.changePct.toFixed(2)}%)`
              : "--"
          }
        />
        <Stat label="24h high" value={formatFixed(stats.high, priceDecimals)} />
        <Stat label="24h low" value={formatFixed(stats.low, priceDecimals)} />
        <Stat
          label={`24h vol (${symbol.split("-")[0]})`}
          value={stats.volume != null ? formatCompact(stats.volume) : "--"}
        />
      </div>
    </div>
  );
}
