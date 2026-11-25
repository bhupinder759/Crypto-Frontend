"use client";

import { memo, useMemo } from "react";
import { QueryErrorCard } from "@/components/common/query-error-card";
import { cn } from "@/lib/utils";
import { decimalsFromIncrement, formatFixed } from "@/lib/utils/precision";
import { useLiveTrades } from "@/modules/trading/hooks/use-trading";
import type { InstrumentDto, TradeDto } from "@/types/api.types";

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function toDate(timestamp: string) {
  const numeric = Number(timestamp);
  if (Number.isFinite(numeric)) {
    return new Date(numeric < 1e12 ? numeric * 1000 : numeric);
  }
  return new Date(timestamp);
}

/** Side from the backend when present, otherwise the tick rule (vs. previous trade). */
function withSides(trades: TradeDto[]) {
  return trades.map((trade, index) => {
    if (trade.side) return { trade, side: trade.side };
    const older = trades[index + 1];
    const side =
      older && Number(trade.price) < Number(older.price) ? "SELL" : "BUY";
    return { trade, side: side as "BUY" | "SELL" };
  });
}

const TradeRow = memo(function TradeRow({
  price,
  quantity,
  time,
  side,
  priceDecimals,
  sizeDecimals,
}: {
  price: string;
  quantity: string;
  time: string;
  side: "BUY" | "SELL";
  priceDecimals: number;
  sizeDecimals: number;
}) {
  return (
    <div className="grid h-[18px] shrink-0 grid-cols-3 items-center px-2 text-[11px] leading-none tabular">
      <span
        className={cn("font-medium", side === "BUY" ? "text-buy" : "text-sell")}
      >
        {formatFixed(price, priceDecimals)}
      </span>
      <span className="text-right">{formatFixed(quantity, sizeDecimals)}</span>
      <span className="text-right text-muted-foreground">{time}</span>
    </div>
  );
});

export function RecentTrades({
  symbol,
  instrument,
}: {
  symbol: string;
  instrument: InstrumentDto | null;
}) {
  const { trades, query } = useLiveTrades(symbol);
  const rows = useMemo(() => withSides(trades), [trades]);
  const priceDecimals = decimalsFromIncrement(instrument?.priceIncrement, 2);
  const sizeDecimals = Math.min(
    6,
    decimalsFromIncrement(instrument?.quantityIncrement, 4),
  );
  const [base, quote] = symbol.split("-");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid grid-cols-3 px-2 py-1 text-[10px] text-muted-foreground">
        <span>Price ({quote})</span>
        <span className="text-right">Size ({base})</span>
        <span className="text-right">Time</span>
      </div>
      {query.isError && trades.length === 0 ? (
        <QueryErrorCard
          compact
          className="m-2"
          title="Trades unavailable"
          error={query.error}
          onRetry={query.refetch}
        />
      ) : rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
          {query.isLoading ? "Loading trades…" : "No trades yet"}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows.map(({ trade, side }) => (
            <TradeRow
              key={trade.id}
              price={trade.price}
              quantity={trade.quantity}
              time={timeFormatter.format(toDate(trade.timestamp))}
              side={side}
              priceDecimals={priceDecimals}
              sizeDecimals={sizeDecimals}
            />
          ))}
        </div>
      )}
    </div>
  );
}
