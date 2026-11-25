import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { formatNumber } from "@/lib/utils/formatter";
import type { OrderBookDto } from "@/types/api.types";

type DepthRow = {
  price: string;
  quantity: string;
  total: number;
  widthPercent: number;
};

const VISIBLE_LEVELS = 12;

function buildDepthRows(
  levels: [string, string][],
  maxVisibleTotal: number,
): DepthRow[] {
  let cumulative = 0;

  return levels.slice(0, VISIBLE_LEVELS).map(([price, quantity]) => {
    cumulative += Number(quantity);

    return {
      price,
      quantity,
      total: cumulative,
      widthPercent:
        maxVisibleTotal > 0 ? (cumulative / maxVisibleTotal) * 100 : 0,
    };
  });
}

const OrderBookRows = memo(function OrderBookRows({
  rows,
  side,
}: {
  rows: DepthRow[];
  side: "bid" | "ask";
}) {
  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <div
          key={`${side}-${row.price}`}
          className="relative overflow-hidden rounded-md px-2 py-1.5 text-sm"
        >
          <div
            className={`absolute inset-y-0 ${side === "bid" ? "right-0 bg-buy/10" : "left-0 bg-sell/10"}`}
            style={{ width: `${Math.min(row.widthPercent, 100)}%` }}
          />
          <div className="relative grid grid-cols-[1fr_1fr_auto] items-center gap-2">
            <span
              className={side === "bid" ? "text-buy" : "text-sell"}
            >
              {formatNumber(row.price, 2)}
            </span>
            <span className="text-right text-muted-foreground">
              {formatNumber(row.quantity, 4)}
            </span>
            <span className="text-right text-xs text-muted-foreground">
              {formatNumber(row.total, 4)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
});

export function OrderBookCard({
  orderBook,
}: {
  orderBook: OrderBookDto | null;
}) {
  const { bids, asks, spread } = useMemo(() => {
    if (!orderBook) {
      return {
        bids: [] as DepthRow[],
        asks: [] as DepthRow[],
        spread: null as number | null,
      };
    }

    const bidLevels = orderBook.bids.slice(0, VISIBLE_LEVELS);
    const askLevels = orderBook.asks.slice(0, VISIBLE_LEVELS);

    const bidTotal = bidLevels.reduce(
      (sum, [, quantity]) => sum + Number(quantity),
      0,
    );
    const askTotal = askLevels.reduce(
      (sum, [, quantity]) => sum + Number(quantity),
      0,
    );
    const maxVisibleTotal = Math.max(bidTotal, askTotal);
    const bestBid = Number(bidLevels[0]?.[0] ?? 0);
    const bestAsk = Number(askLevels[0]?.[0] ?? 0);

    return {
      bids: buildDepthRows(bidLevels, maxVisibleTotal),
      asks: buildDepthRows(askLevels, maxVisibleTotal),
      spread: bestBid > 0 && bestAsk > 0 ? bestAsk - bestBid : null,
    };
  }, [orderBook]);

  if (!orderBook) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Book</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No liquidity snapshot yet"
            description="Waiting for the live Binance depth stream."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="space-y-2">
        <CardTitle>Order Book</CardTitle>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Live Binance depth</span>
          <span>
            {spread !== null
              ? `Spread ${formatNumber(spread, 2)}`
              : "Spread --"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Bids
          </p>
          <OrderBookRows rows={bids} side="bid" />
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Asks
          </p>
          <OrderBookRows rows={asks} side="ask" />
        </div>
      </CardContent>
    </Card>
  );
}
