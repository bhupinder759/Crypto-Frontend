"use client";

import Link from "next/link";
import type { Route } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/constants/routes";
import { formatCurrency } from "@/lib/utils/formatter";
import { formatFixed } from "@/lib/utils/precision";
import type {
  Holding,
  PortfolioTotals,
} from "@/modules/portfolio/services/valuation";

export function WalletBalances({
  holdings,
  totals,
  loading,
}: {
  holdings: Holding[];
  totals: PortfolioTotals;
  loading: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-end justify-between gap-2 border-b border-border px-3 py-2.5">
        <div>
          <p className="text-xs text-muted-foreground">Estimated balance</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-40" />
          ) : (
            <p className="font-heading text-xl font-semibold tabular">
              {formatCurrency(totals.equityUsd)}
            </p>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground tabular">
          Cash {formatCurrency(totals.cashUsd)}
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-xs">
          <thead>
            <tr className="border-b border-border text-[11px] text-muted-foreground">
              <th className="h-7 px-3 text-left font-normal">Asset</th>
              <th className="px-2 text-right font-normal">Available</th>
              <th className="px-2 text-right font-normal">In orders</th>
              <th className="px-2 text-right font-normal">Total</th>
              <th className="px-2 text-right font-normal">USD value</th>
              <th className="w-40 px-3 text-left font-normal">Allocation</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }, (_, i) => (
                <tr key={i} className="h-10 border-b border-border/60">
                  <td colSpan={6} className="px-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                </tr>
              ))
            ) : holdings.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No balances yet.
                </td>
              </tr>
            ) : (
              holdings.map((h) => {
                const digits = h.symbol ? 6 : 2;
                return (
                  <tr
                    key={h.asset}
                    className="h-10 border-b border-border/60 last:border-0"
                  >
                    <td className="px-3 font-medium">
                      {h.symbol ? (
                        <Link
                          href={`${routes.trading}/${h.symbol}` as Route}
                          className="hover:text-primary"
                        >
                          {h.asset}
                        </Link>
                      ) : (
                        h.asset
                      )}
                    </td>
                    <td className="px-2 text-right tabular">
                      {formatFixed(h.available, digits)}
                    </td>
                    <td className="px-2 text-right tabular text-muted-foreground">
                      {formatFixed(h.reserved, digits)}
                    </td>
                    <td className="px-2 text-right tabular">
                      {formatFixed(h.amount, digits)}
                    </td>
                    <td className="px-2 text-right font-medium tabular">
                      {h.price != null ? formatCurrency(h.valueUsd) : "--"}
                    </td>
                    <td className="px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${h.allocationPct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-[10px] tabular text-muted-foreground">
                          {h.allocationPct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
