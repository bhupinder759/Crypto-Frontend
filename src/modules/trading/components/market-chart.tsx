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
  const highs = orderedCandles.map((candle) => Number(candle.high));
  const lows = orderedCandles.map((candle) => Number(candle.low));
  const minPrice = Math.min(...lows);
  const maxPrice = Math.max(...highs);
  const range = maxPrice - minPrice || 1;
  const candleWidth = Math.max(720 / orderedCandles.length, 6);
  const chartLeft = 28;
  const chartTop = 18;
  const chartHeight = 144;

  const yForPrice = (price: number) =>
    chartTop + ((maxPrice - price) / range) * chartHeight;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Action</CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox="0 0 960 180" className="h-[240px] w-full overflow-visible">
          {orderedCandles.map((candle, index) => {
            const open = Number(candle.open);
            const high = Number(candle.high);
            const low = Number(candle.low);
            const close = Number(candle.close);
            const x = chartLeft + index * candleWidth + candleWidth / 2;
            const bodyTop = Math.min(yForPrice(open), yForPrice(close));
            const bodyBottom = Math.max(yForPrice(open), yForPrice(close));
            const bodyHeight = Math.max(bodyBottom - bodyTop, 2);
            const bullish = close >= open;
            const color = bullish ? "rgb(16,185,129)" : "rgb(239,68,68)";

            return (
              <g key={candle.id}>
                <line
                  x1={x}
                  x2={x}
                  y1={yForPrice(high)}
                  y2={yForPrice(low)}
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <rect
                  x={x - candleWidth * 0.3}
                  y={bodyTop}
                  width={Math.max(candleWidth * 0.6, 3)}
                  height={bodyHeight}
                  rx="1.5"
                  fill={bullish ? "rgba(16,185,129,0.22)" : "rgba(239,68,68,0.22)"}
                  stroke={color}
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        </svg>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Low {minPrice.toFixed(4)}</span>
          <span>High {maxPrice.toFixed(4)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
