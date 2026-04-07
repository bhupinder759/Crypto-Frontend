"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { InstrumentDto } from "@/types/api.types";

export function MarketToolbar({
  symbol,
  symbols,
  interval,
  onIntervalChange,
  instrument,
}: {
  symbol: string;
  symbols: string[];
  interval: string;
  onIntervalChange: (value: string) => void;
  instrument: InstrumentDto | null;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="market-symbol">Market</Label>
          <select
            id="market-symbol"
            className="flex h-10 min-w-[220px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
            value={symbol}
            onChange={(event) =>
              startTransition(() => {
                router.push(`/trading/${event.target.value}`);
              })
            }
          >
            {symbols.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="market-interval">Chart Interval</Label>
          <select
            id="market-interval"
            className="flex h-10 min-w-[180px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
            value={interval}
            onChange={(event) => onIntervalChange(event.target.value)}
          >
            {["1m", "5m", "15m", "1h", "4h", "1d"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="info">{instrument?.baseAsset ?? symbol.split("-")[0]}</Badge>
        <Badge variant="default">{instrument?.quoteAsset ?? symbol.split("-")[1] ?? "USD"}</Badge>
        <Badge variant="warning">
          {symbol.includes("JPY") || symbol.includes("EUR") || symbol.includes("GBP") || symbol.includes("CHF") || symbol.includes("CAD") || symbol.includes("AUD")
            ? "FX Reference"
            : "Crypto Reference"}
        </Badge>
      </div>
    </div>
  );
}
