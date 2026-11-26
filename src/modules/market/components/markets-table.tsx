"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Star } from "lucide-react";
import { QueryErrorCard } from "@/components/common/query-error-card";
import { Sparkline } from "@/components/common/sparkline";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFlash } from "@/lib/hooks/use-flash";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import { formatCompact } from "@/lib/utils/formatter";
import { decimalsFromPrice, formatFixed } from "@/lib/utils/precision";
import { useMarketSummaries } from "@/modules/market/hooks/use-market-overview";
import type { MarketSummary } from "@/modules/market/services/market-overview";
import { useFavoritesStore } from "@/modules/market/store/favorites.store";

type Category = "favorites" | "all" | "gainers" | "losers";
type SortKey =
  "symbol" | "last" | "changePct24h" | "high24h" | "low24h" | "quoteVolume24h";

const columns: { key: SortKey; label: string; className?: string }[] = [
  { key: "symbol", label: "Pair" },
  { key: "last", label: "Price", className: "text-right" },
  { key: "changePct24h", label: "24h %", className: "text-right" },
  {
    key: "high24h",
    label: "24h high",
    className: "hidden text-right md:table-cell",
  },
  {
    key: "low24h",
    label: "24h low",
    className: "hidden text-right md:table-cell",
  },
  {
    key: "quoteVolume24h",
    label: "Volume",
    className: "hidden text-right sm:table-cell",
  },
];

export function ChangeText({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  if (value == null)
    return <span className={cn("text-muted-foreground", className)}>--</span>;
  return (
    <span
      className={cn(
        value >= 0 ? "text-buy" : "text-sell",
        "tabular",
        className,
      )}
    >
      {value > 0 ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

const MarketRow = memo(function MarketRow({
  market,
  favorite,
  onToggle,
  onOpen,
}: {
  market: MarketSummary;
  favorite: boolean;
  onToggle: (symbol: string) => void;
  onOpen: (symbol: string) => void;
}) {
  const priceRef = useFlash<HTMLSpanElement>(market.last);
  const decimals = decimalsFromPrice(market.last);

  return (
    <tr
      onClick={() => onOpen(market.symbol)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target === event.currentTarget) onOpen(market.symbol);
      }}
      tabIndex={0}
      className="h-11 cursor-pointer border-b border-border/60 text-xs hover:bg-accent/50"
    >
      <td className="w-8 pl-2">
        <button
          type="button"
          aria-label={
            favorite
              ? `Remove ${market.symbol} from favorites`
              : `Add ${market.symbol} to favorites`
          }
          aria-pressed={favorite}
          onClick={(event) => {
            event.stopPropagation();
            onToggle(market.symbol);
          }}
          className="rounded p-1 text-muted-foreground hover:text-warning"
        >
          <Star
            className={cn("size-3.5", favorite && "fill-warning text-warning")}
          />
        </button>
      </td>
      <td className="px-2">
        <span className="font-semibold">{market.base}</span>
        <span className="text-muted-foreground">/{market.quote}</span>
      </td>
      <td className="px-2 text-right">
        <span ref={priceRef} className="rounded px-1 font-medium tabular">
          {formatFixed(market.last, decimals)}
        </span>
      </td>
      <td className="px-2 text-right">
        <ChangeText value={market.changePct24h} />
      </td>
      <td className="hidden px-2 text-right tabular md:table-cell">
        {formatFixed(market.high24h, decimals)}
      </td>
      <td className="hidden px-2 text-right tabular md:table-cell">
        {formatFixed(market.low24h, decimals)}
      </td>
      <td className="hidden px-2 text-right tabular sm:table-cell">
        {market.quoteVolume24h != null
          ? formatCompact(market.quoteVolume24h)
          : "--"}
      </td>
      <td className="hidden px-2 lg:table-cell">
        <Sparkline values={market.sparkline} className="ml-auto" />
      </td>
    </tr>
  );
});

export function MarketsTable() {
  const router = useRouter();
  const { summaries, isLoading, isError, error, refetch } =
    useMarketSummaries();
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggle = useFavoritesStore((s) => s.toggle);
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "quoteVolume24h",
    dir: "desc",
  });

  useEffect(() => {
    void useFavoritesStore.persist.rehydrate();
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toUpperCase().replace("/", "-");
    let list = summaries.filter(
      (m) => !q || m.symbol.includes(q) || m.base.includes(q),
    );
    if (category === "favorites")
      list = list.filter((m) => favorites.includes(m.symbol));
    if (category === "gainers")
      list = list.filter((m) => (m.changePct24h ?? 0) > 0);
    if (category === "losers")
      list = list.filter((m) => (m.changePct24h ?? 0) < 0);

    const sortKey: SortKey =
      category === "gainers" || category === "losers"
        ? "changePct24h"
        : sort.key;
    const dir =
      category === "gainers"
        ? "desc"
        : category === "losers"
          ? "asc"
          : sort.dir;
    return list.slice().sort((a, b) => {
      if (sortKey === "symbol") {
        return dir === "asc"
          ? a.symbol.localeCompare(b.symbol)
          : b.symbol.localeCompare(a.symbol);
      }
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      return dir === "asc" ? av - bv : bv - av;
    });
  }, [category, favorites, search, sort, summaries]);

  const onOpen = (symbol: string) =>
    router.push(`${routes.trading}/${symbol}` as Route);

  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "symbol" ? "asc" : "desc" },
    );

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-2 py-1.5">
        <Tabs
          value={category}
          onValueChange={(v) => setCategory(v as Category)}
        >
          <TabsList variant="line" className="h-8">
            <TabsTrigger value="favorites" className="text-xs">
              <Star className="size-3" /> Favorites
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="gainers" className="text-xs">
              Gainers
            </TabsTrigger>
            <TabsTrigger value="losers" className="text-xs">
              Losers
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search pair"
            aria-label="Search markets"
            className="h-8 pl-7 text-xs"
          />
        </div>
      </div>

      {isError ? (
        <QueryErrorCard
          className="m-3"
          title="Couldn't load markets"
          error={error}
          onRetry={refetch}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border text-[11px] text-muted-foreground">
                <th className="w-8" />
                {columns.map((column) => {
                  const active =
                    sort.key === column.key &&
                    category !== "gainers" &&
                    category !== "losers";
                  const Icon = active
                    ? sort.dir === "asc"
                      ? ArrowUp
                      : ArrowDown
                    : ArrowUpDown;
                  return (
                    <th
                      key={column.key}
                      aria-sort={
                        active
                          ? sort.dir === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                      className={cn(
                        "h-8 px-2 font-normal",
                        column.className ?? "text-left",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={cn(
                          "inline-flex items-center gap-1 hover:text-foreground",
                          active && "text-foreground",
                        )}
                      >
                        {column.label}
                        <Icon className="size-3 opacity-60" />
                      </button>
                    </th>
                  );
                })}
                <th className="hidden h-8 px-2 text-right font-normal lg:table-cell">
                  7d
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }, (_, i) => (
                    <tr key={i} className="h-11 border-b border-border/60">
                      <td colSpan={8} className="px-2">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                : rows.map((market) => (
                    <MarketRow
                      key={market.symbol}
                      market={market}
                      favorite={favorites.includes(market.symbol)}
                      onToggle={toggle}
                      onOpen={onOpen}
                    />
                  ))}
              {!isLoading && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center text-xs text-muted-foreground"
                  >
                    {category === "favorites"
                      ? "No favorites yet — tap the star next to a pair."
                      : search
                        ? `No pairs match “${search}”.`
                        : "No markets to show."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
