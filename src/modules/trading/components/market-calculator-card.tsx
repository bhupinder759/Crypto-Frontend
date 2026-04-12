"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InstrumentDto, TickerDto } from "@/types/api.types";
import { formatNumber } from "@/lib/utils/formatter";

function isForexSymbol(symbol: string) {
  const [baseAsset, quoteAsset] = symbol.split("-");
  const fiatAssets = new Set(["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD"]);
  return fiatAssets.has(baseAsset ?? "") && fiatAssets.has(quoteAsset ?? "");
}

function getPipSize(symbol: string) {
  return symbol.endsWith("JPY") ? 0.01 : 0.0001;
}

export function MarketCalculatorCard({
  symbol,
  instrument,
  ticker,
}: {
  symbol: string;
  instrument: InstrumentDto | null;
  ticker: TickerDto | null;
}) {
  const [side, setSide] = useState<"LONG" | "SHORT">("LONG");
  const [size, setSize] = useState("1");
  const [entryPrice, setEntryPrice] = useState(ticker?.lastPrice ?? "");
  const [leverage, setLeverage] = useState("5");

  const calculations = useMemo(() => {
    const quantity = Number(size || 0);
    const markPrice = Number(ticker?.lastPrice ?? 0);
    const entry = Number(entryPrice || markPrice || 0);
    const leverageValue = Math.max(Number(leverage || 1), 1);
    const notional = quantity * markPrice;
    const margin = leverageValue > 0 ? notional / leverageValue : notional;
    const priceDelta = side === "LONG" ? markPrice - entry : entry - markPrice;
    const unrealizedPnl = quantity * priceDelta;
    const pipDelta = isForexSymbol(symbol)
      ? priceDelta / getPipSize(symbol)
      : 0;

    return {
      markPrice,
      notional,
      margin,
      unrealizedPnl,
      pipDelta,
    };
  }, [entryPrice, leverage, side, size, symbol, ticker?.lastPrice]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className={`rounded-lg border px-3 py-2 text-sm ${side === "LONG" ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-border"}`}
            onClick={() => setSide("LONG")}
          >
            Long
          </button>
          <button
            type="button"
            className={`rounded-lg border px-3 py-2 text-sm ${side === "SHORT" ? "border-rose-500 bg-rose-500/10 text-rose-500" : "border-border"}`}
            onClick={() => setSide("SHORT")}
          >
            Short
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="calc-size">Size</Label>
            <Input
              id="calc-size"
              value={size}
              onChange={(event) => setSize(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calc-entry">Entry</Label>
            <Input
              id="calc-entry"
              value={entryPrice}
              onChange={(event) => setEntryPrice(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calc-leverage">Leverage</Label>
            <Input
              id="calc-leverage"
              value={leverage}
              onChange={(event) => setLeverage(event.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Mark Price
            </p>
            <p className="mt-2 text-lg font-medium">
              {formatNumber(calculations.markPrice, 4)}{" "}
              {instrument?.quoteAsset ?? "USD"}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Position Notional
            </p>
            <p className="mt-2 text-lg font-medium">
              {formatNumber(calculations.notional, 2)}{" "}
              {instrument?.quoteAsset ?? "USD"}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Margin Required
            </p>
            <p className="mt-2 text-lg font-medium">
              {formatNumber(calculations.margin, 2)}{" "}
              {instrument?.quoteAsset ?? "USD"}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Unrealized PnL
            </p>
            <p
              className={`mt-2 text-lg font-medium ${calculations.unrealizedPnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}
            >
              {formatNumber(calculations.unrealizedPnl, 2)}{" "}
              {instrument?.quoteAsset ?? "USD"}
            </p>
            {isForexSymbol(symbol) ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Pip delta {formatNumber(calculations.pipDelta, 1)}
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
