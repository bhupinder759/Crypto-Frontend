"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import type { CandleDto } from "@/types/api.types";

export function MarketChart({ candles }: { candles: CandleDto[] }) {
  if (candles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Action</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No candle history"
            description="Once trade history exists, this chart will render price movement."
          />
        </CardContent>
      </Card>
    );
  }

  const orderedCandles = candles.slice().reverse();
  const closes = orderedCandles.map((candle) => Number(candle.close));
  const minClose = Math.min(...closes);
  const maxClose = Math.max(...closes);
  const range = maxClose - minClose || 1;
  const width = Math.max(orderedCandles.length - 1, 1);
  const points = orderedCandles
    .map((candle, index) => {
      const x = (index / width) * 920 + 20;
      const normalized = (Number(candle.close) - minClose) / range;
      const y = 160 - normalized * 120;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Action</CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox="0 0 960 180" className="h-[240px] w-full overflow-visible">
          <defs>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(6,182,212,0.7)" />
              <stop offset="100%" stopColor="rgba(6,182,212,0)" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke="rgb(6,182,212)"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points}
          />
        </svg>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Low {minClose.toFixed(4)}</span>
          <span>High {maxClose.toFixed(4)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
