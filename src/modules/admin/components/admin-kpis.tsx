"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type Kpi = {
  label: string;
  value: string;
  hint?: string;
  /** Percent trend; positive = good unless `invert`. */
  trend?: number | null;
  invert?: boolean;
  tone?: "warning";
};

export function AdminKpis({
  items,
  loading,
}: {
  items: Kpi[];
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
      {items.map((kpi) => {
        const good =
          kpi.trend != null && (kpi.invert ? kpi.trend < 0 : kpi.trend > 0);
        return (
          <div
            key={kpi.label}
            className="rounded-lg border border-border bg-card p-3"
          >
            <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
            {loading ? (
              <Skeleton className="mt-1.5 h-6 w-16" />
            ) : (
              <p
                className={cn(
                  "mt-0.5 text-lg font-semibold tabular",
                  kpi.tone === "warning" && "text-warning",
                )}
              >
                {kpi.value}
              </p>
            )}
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
              {kpi.trend != null && !loading ? (
                <span
                  className={cn(
                    "flex items-center tabular",
                    good ? "text-buy" : "text-sell",
                  )}
                >
                  {kpi.trend >= 0 ? (
                    <ArrowUpRight className="size-3" />
                  ) : (
                    <ArrowDownRight className="size-3" />
                  )}
                  {Math.abs(kpi.trend).toFixed(0)}%
                </span>
              ) : null}
              {kpi.hint}
            </p>
          </div>
        );
      })}
    </div>
  );
}
