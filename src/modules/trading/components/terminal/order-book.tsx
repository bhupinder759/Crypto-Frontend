"use client";

import { memo, useMemo, useState } from "react";
import { BarChart3, Rows3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFlash } from "@/lib/hooks/use-flash";
import { cn } from "@/lib/utils";
import { decimalsFromIncrement, formatFixed } from "@/lib/utils/precision";
import { useLiveOrderBook } from "@/modules/trading/hooks/use-trading";
import { useTicketStore } from "@/modules/trading/store/ticket.store";
import {
  buildBookSide,
  groupingOptions,
  spreadInfo,
  type BookLevel,
  type BookSide,
} from "@/modules/trading/utils/orderbook";
import type { InstrumentDto } from "@/types/api.types";

const DEPTH = 18;

const BookRow = memo(function BookRow({
  side,
  price,
  size,
  total,
  depthPct,
  sizeDecimals,
  onPick,
}: {
  side: BookSide;
  price: string;
  size: number;
  total: number;
  depthPct: number;
  sizeDecimals: number;
  onPick: (price: string) => void;
}) {
  // Flash the row when the resting size at this price changes.
  const ref = useFlash<HTMLButtonElement>(size);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onPick(price)}
      className="relative grid h-[18px] w-full shrink-0 grid-cols-3 items-center px-2 text-[11px] leading-none tabular hover:bg-accent/70"
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 right-0",
          side === "bid" ? "bg-buy/12" : "bg-sell/12",
        )}
        style={{ width: `${depthPct}%` }}
      />
      <span
        className={cn(
          "relative text-left font-medium",
          side === "bid" ? "text-buy" : "text-sell",
        )}
      >
        {price}
      </span>
      <span className="relative text-right">
        {formatFixed(size, sizeDecimals)}
      </span>
      <span className="relative text-right text-muted-foreground">
        {formatFixed(total, sizeDecimals)}
      </span>
    </button>
  );
});

function DepthChart({ bids, asks }: { bids: BookLevel[]; asks: BookLevel[] }) {
  const path = useMemo(() => {
    if (bids.length === 0 && asks.length === 0) return null;
    const minP = bids.at(-1)?.priceNum ?? asks[0]!.priceNum;
    const maxP = asks.at(-1)?.priceNum ?? bids[0]!.priceNum;
    const maxT =
      Math.max(bids.at(-1)?.total ?? 0, asks.at(-1)?.total ?? 0) || 1;
    const range = maxP - minP || 1;
    const x = (p: number) => ((p - minP) / range) * 100;
    const y = (t: number) => 100 - (t / maxT) * 95;
    const step = (levels: BookLevel[]) => {
      let d = "";
      let prevY = 100;
      for (const level of levels) {
        d += ` L${x(level.priceNum)},${prevY} L${x(level.priceNum)},${y(level.total)}`;
        prevY = y(level.total);
      }
      return { d, lastY: prevY };
    };
    const b = step(bids);
    const a = step(asks);
    const bidStart = bids[0] ? x(bids[0].priceNum) : 50;
    const askStart = asks[0] ? x(asks[0].priceNum) : 50;
    return {
      bid: `M${bidStart},100${b.d} L0,${b.lastY} L0,100 Z`,
      ask: `M${askStart},100${a.d} L100,${a.lastY} L100,100 Z`,
    };
  }, [asks, bids]);

  if (!path) return <BookEmpty />;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-full w-full"
      role="img"
      aria-label="Market depth"
    >
      <path
        d={path.bid}
        className="fill-buy/20 stroke-buy"
        strokeWidth={0.6}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={path.ask}
        className="fill-sell/20 stroke-sell"
        strokeWidth={0.6}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function BookEmpty() {
  return (
    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
      No liquidity yet
    </div>
  );
}

export function OrderBook({
  symbol,
  instrument,
}: {
  symbol: string;
  instrument: InstrumentDto | null;
}) {
  const book = useLiveOrderBook(symbol);
  const pickPrice = useTicketStore((s) => s.pickPrice);
  const options = useMemo(
    () => groupingOptions(instrument?.priceIncrement),
    [instrument?.priceIncrement],
  );
  const [groupingChoice, setGrouping] = useState<string | null>(null);
  const grouping =
    groupingChoice && options.includes(groupingChoice)
      ? groupingChoice
      : options[0]!;
  const [view, setView] = useState<"book" | "depth">("book");
  const sizeDecimals = Math.min(
    6,
    decimalsFromIncrement(instrument?.quantityIncrement, 4),
  );
  const priceDecimals = decimalsFromIncrement(grouping, 2);

  const { bids, asks, maxTotal } = useMemo(() => {
    const bidsSide = buildBookSide(book?.bids ?? [], "bid", grouping, DEPTH);
    const asksSide = buildBookSide(book?.asks ?? [], "ask", grouping, DEPTH);
    return {
      bids: bidsSide,
      asks: asksSide,
      maxTotal: Math.max(
        bidsSide.at(-1)?.total ?? 0,
        asksSide.at(-1)?.total ?? 0,
      ),
    };
  }, [book, grouping]);

  const spread = spreadInfo(bids[0]?.priceNum, asks[0]?.priceNum);
  const [base, quote] = symbol.split("-");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-2 py-1">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Order book"
            aria-pressed={view === "book"}
            onClick={() => setView("book")}
            className={cn(
              "rounded p-1 text-muted-foreground hover:text-foreground",
              view === "book" && "bg-accent text-foreground",
            )}
          >
            <Rows3 className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Depth chart"
            aria-pressed={view === "depth"}
            onClick={() => setView("depth")}
            className={cn(
              "rounded p-1 text-muted-foreground hover:text-foreground",
              view === "depth" && "bg-accent text-foreground",
            )}
          >
            <BarChart3 className="size-3.5" />
          </button>
        </div>
        {book?.source ? (
          <span
            className="mr-auto ml-1 text-[10px] text-muted-foreground"
            title={
              book.source === "internal"
                ? "Exchange order book (orders match here)"
                : "Reference book from the upstream market"
            }
          >
            {book.source === "internal" ? "Exchange" : "Reference"}
          </span>
        ) : null}
        <Select value={grouping} onValueChange={setGrouping}>
          <SelectTrigger
            size="sm"
            className="h-6 min-w-20 px-2 text-[11px]"
            aria-label="Price grouping"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {options.map((option) => (
              <SelectItem
                key={option}
                value={option}
                className="text-xs tabular"
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {view === "depth" ? (
        <div className="min-h-0 flex-1 p-2">
          <DepthChart bids={bids} asks={asks} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 px-2 pb-1 text-[10px] text-muted-foreground">
            <span>Price ({quote})</span>
            <span className="text-right">Size ({base})</span>
            <span className="text-right">Total</span>
          </div>
          {bids.length === 0 && asks.length === 0 ? (
            <BookEmpty />
          ) : (
            <>
              {/* Asks: best ask sits next to the spread row; worst asks clip at the top. */}
              <div className="flex min-h-0 flex-1 flex-col-reverse overflow-hidden">
                {asks.map((level) => (
                  <BookRow
                    key={level.price}
                    side="ask"
                    price={level.price}
                    size={level.size}
                    total={level.total}
                    depthPct={maxTotal ? (level.total / maxTotal) * 100 : 0}
                    sizeDecimals={sizeDecimals}
                    onPick={pickPrice}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between border-y border-border bg-muted/40 px-2 py-1 text-[11px] tabular">
                <span className="font-semibold">
                  {spread ? formatFixed(spread.mid, priceDecimals + 1) : "--"}
                  <span className="ml-1 font-normal text-muted-foreground">
                    mid
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Spread{" "}
                  {spread ? formatFixed(spread.spread, priceDecimals) : "--"}
                  {spread ? ` (${spread.spreadPct.toFixed(3)}%)` : ""}
                </span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {bids.map((level) => (
                  <BookRow
                    key={level.price}
                    side="bid"
                    price={level.price}
                    size={level.size}
                    total={level.total}
                    depthPct={maxTotal ? (level.total / maxTotal) * 100 : 0}
                    sizeDecimals={sizeDecimals}
                    onPick={pickPrice}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
