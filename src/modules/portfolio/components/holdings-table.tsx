"use client";

import Link from "next/link";
import type { Route } from "next";
import { Sparkline } from "@/components/common/sparkline";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatter";
import { decimalsFromPrice, formatFixed } from "@/lib/utils/precision";
import type { Holding } from "@/modules/portfolio/services/valuation";

export function HoldingsTable({
  holdings,
  loading,
}: {
  holdings: Holding[];
  loading: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex h-9 items-center justify-between border-b border-border px-3">
        <h2 className="text-xs font-medium">Holdings</h2>
        <Link
          href={routes.wallet as Route}
          className="text-[11px] text-muted-foreground hover:text-foreground"
        >
          Wallet →
        </Link>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-xs">
          <thead>
            <tr className="border-b border-border text-[11px] text-muted-foreground">
              <th className="h-7 px-3 text-left font-normal">Asset</th>
              <th className="px-2 text-right font-normal">Amount</th>
              <th className="px-2 text-right font-normal">Price</th>
              <th className="px-2 text-right font-normal">Value</th>
              <th className="px-2 text-right font-normal">24h PnL</th>
              <th className="hidden px-3 text-right font-normal md:table-cell">
                7d
              </th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 3 }, (_, i) => (
                  <tr key={i} className="h-10 border-b border-border/60">
                    <td colSpan={6} className="px-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              : holdings.map((h) => (
                  <tr
                    key={h.asset}
                    className="h-10 border-b border-border/60 last:border-0"
                  >
                    <td className="px-3">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-accent text-[9px] font-bold">
                          {h.asset.slice(0, 3)}
                        </span>
                        <div className="leading-tight">
                          {h.symbol ? (
                            <Link
                              href={`${routes.trading}/${h.symbol}` as Route}
                              className="font-medium hover:text-primary"
                            >
                              {h.asset}
                            </Link>
                          ) : (
                            <span className="font-medium">{h.asset}</span>
                          )}
                          <p className="text-[10px] text-muted-foreground tabular">
                            {h.allocationPct.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 text-right tabular">
                      {formatFixed(h.amount, h.symbol ? 6 : 2)}
                      {h.reserved > 0 ? (
                        <p className="text-[10px] text-muted-foreground">
                          {formatFixed(h.reserved, h.symbol ? 6 : 2)} in orders
                        </p>
                      ) : null}
                    </td>
                    <td className="px-2 text-right tabular">
                      {h.price != null
                        ? formatFixed(h.price, decimalsFromPrice(h.price))
                        : "--"}
                    </td>
                    <td className="px-2 text-right font-medium tabular">
                      {formatCurrency(h.valueUsd)}
                    </td>
                    <td className="px-2 text-right tabular">
                      {h.symbol ? (
                        <span
                          className={cn(
                            h.change24hUsd >= 0 ? "text-buy" : "text-sell",
                          )}
                        >
                          {h.change24hUsd >= 0 ? "+" : ""}
                          {formatCurrency(h.change24hUsd)}
                          {h.changePct24h != null ? (
                            <span className="block text-[10px]">
                              {h.changePct24h >= 0 ? "+" : ""}
                              {h.changePct24h.toFixed(2)}%
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="hidden px-3 md:table-cell">
                      {h.symbol ? (
                        <Sparkline
                          values={h.sparkline}
                          width={80}
                          height={24}
                          className="ml-auto"
                        />
                      ) : null}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
