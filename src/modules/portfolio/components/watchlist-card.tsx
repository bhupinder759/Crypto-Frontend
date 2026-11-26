"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Star } from "lucide-react";
import { Sparkline } from "@/components/common/sparkline";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/constants/routes";
import { decimalsFromPrice, formatFixed } from "@/lib/utils/precision";
import { ChangeText } from "@/modules/market/components/markets-table";
import type { MarketSummary } from "@/modules/market/services/market-overview";
import { useFavoritesStore } from "@/modules/market/store/favorites.store";

export function WatchlistCard({
  markets,
  loading,
}: {
  markets: MarketSummary[];
  loading: boolean;
}) {
  const favorites = useFavoritesStore((s) => s.favorites);
  useEffect(() => {
    void useFavoritesStore.persist.rehydrate();
  }, []);

  const list = useMemo(() => {
    const fav = markets.filter((m) => favorites.includes(m.symbol));
    // No favorites yet: show the most active markets instead.
    return (
      fav.length > 0
        ? fav
        : markets
            .slice()
            .sort((a, b) => (b.quoteVolume24h ?? 0) - (a.quoteVolume24h ?? 0))
    ).slice(0, 6);
  }, [favorites, markets]);

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex h-9 items-center justify-between border-b border-border px-3">
        <h2 className="flex items-center gap-1.5 text-xs font-medium">
          <Star className="size-3 text-warning" />{" "}
          {favorites.length ? "Watchlist" : "Top markets"}
        </h2>
        <Link
          href={routes.markets as Route}
          className="text-[11px] text-muted-foreground hover:text-foreground"
        >
          Markets →
        </Link>
      </header>
      {loading ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="px-3 py-8 text-center text-xs text-muted-foreground">
          Markets unavailable.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {list.map((m) => (
            <li key={m.symbol}>
              <Link
                href={`${routes.trading}/${m.symbol}` as Route}
                className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-accent/50"
              >
                <span className="w-20 font-medium">
                  {m.base}
                  <span className="text-muted-foreground">/{m.quote}</span>
                </span>
                <Sparkline values={m.sparkline} width={72} height={22} />
                <span className="ml-auto text-right">
                  <span className="block tabular">
                    {formatFixed(m.last, decimalsFromPrice(m.last))}
                  </span>
                  <ChangeText value={m.changePct24h} className="text-[10px]" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
