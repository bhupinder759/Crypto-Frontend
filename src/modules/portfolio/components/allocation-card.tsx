"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/formatter";
import type { Holding } from "@/modules/portfolio/services/valuation";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function AllocationCard({
  holdings,
  loading,
}: {
  holdings: Holding[];
  loading: boolean;
}) {
  const top = holdings.filter((h) => h.valueUsd > 0).slice(0, 4);
  const rest = holdings.slice(4).reduce((sum, h) => sum + h.valueUsd, 0);
  const data = [
    ...top.map((h) => ({
      asset: h.asset,
      value: h.valueUsd,
      pct: h.allocationPct,
    })),
    ...(rest > 0
      ? [
          {
            asset: "Other",
            value: rest,
            pct: holdings.slice(4).reduce((s, h) => s + h.allocationPct, 0),
          },
        ]
      : []),
  ];
  const config = Object.fromEntries(
    data.map((d, i) => [
      d.asset,
      { label: d.asset, color: COLORS[i % COLORS.length] },
    ]),
  ) satisfies ChartConfig;

  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <h2 className="text-xs font-medium">Allocation</h2>
      {loading ? (
        <Skeleton className="mx-auto mt-3 size-36 rounded-full" />
      ) : data.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
          No assets yet
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-4">
          <ChartContainer
            config={config}
            className="aspect-square h-36 shrink-0"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    nameKey="asset"
                    formatter={(v, n) => `${n} ${formatCurrency(Number(v))}`}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="asset"
                innerRadius="62%"
                outerRadius="100%"
                strokeWidth={2}
                stroke="var(--card)"
                isAnimationActive={false}
              >
                {data.map((d, i) => (
                  <Cell key={d.asset} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <ul className="min-w-0 flex-1 space-y-1.5">
            {data.map((d, i) => (
              <li key={d.asset} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2 shrink-0 rounded-sm"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="font-medium">{d.asset}</span>
                <span className="ml-auto tabular text-muted-foreground">
                  {d.pct.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
