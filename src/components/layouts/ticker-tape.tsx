"use client";

import Link from "next/link";
import type { Route } from "next";
import { memo } from "react";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import { decimalsFromPrice, formatFixed } from "@/lib/utils/precision";
import { useMarketSummaries } from "@/modules/market/hooks/use-market-overview";
import type { MarketSummary } from "@/modules/market/services/market-overview";

const TapeItem = memo(function TapeItem({ market }: { market: MarketSummary }) {
  const pct = market.changePct24h;
  return (
    <Link
      href={`${routes.trading}/${market.symbol}` as Route}
      className="flex shrink-0 items-center gap-1.5 px-3 text-[11px] hover:text-foreground"
    >
      <span className="font-medium text-foreground">
        {market.base}/{market.quote}
      </span>
      <span className="tabular">
        {formatFixed(market.last, decimalsFromPrice(market.last))}
      </span>
      <span
        className={cn(
          "tabular",
          pct == null ? "" : pct >= 0 ? "text-buy" : "text-sell",
        )}
      >
        {pct == null ? "--" : `${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`}
      </span>
    </Link>
  );
});

/** Slim auto-scrolling ticker strip (pauses on hover, static for reduced motion). */
export function TickerTape() {
  const { summaries } = useMarketSummaries();
  const items = summaries.filter((m) => m.last != null);
  if (items.length === 0) return null;

  return (
    <div className="group relative flex h-7 overflow-hidden border-t border-border text-muted-foreground [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]">
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className="flex shrink-0 animate-[ticker_40s_linear_infinite] items-center group-hover:[animation-play-state:paused] motion-reduce:animate-none"
        >
          {items.map((market) => (
            <TapeItem key={market.symbol} market={market} />
          ))}
        </div>
      ))}
    </div>
  );
}
