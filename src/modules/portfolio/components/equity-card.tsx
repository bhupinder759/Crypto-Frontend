"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatter";
import { useEquityHistory } from "@/modules/portfolio/hooks/use-portfolio";
import {
  EQUITY_RANGES,
  type EquityRange,
} from "@/modules/portfolio/services/equity-history";
import type {
  Holding,
  PortfolioTotals,
} from "@/modules/portfolio/services/valuation";

const chartConfig = {
  equity: { label: "Equity", color: "var(--primary)" },
} satisfies ChartConfig;

const rangeFormat: Record<EquityRange, Intl.DateTimeFormatOptions> = {
  "24H": { hour: "2-digit", minute: "2-digit" },
  "7D": { weekday: "short" },
  "30D": { month: "short", day: "numeric" },
  "90D": { month: "short", day: "numeric" },
};

export function EquityCard({
  holdings,
  totals,
  loading,
  modeLabel,
}: {
  holdings: Holding[];
  totals: PortfolioTotals;
  loading: boolean;
  modeLabel: string;
}) {
  const [range, setRange] = useState<EquityRange>("7D");
  const [mountedAt] = useState(() => Math.floor(Date.now() / 1000));
  const history = useEquityHistory(holdings, range);
  const tickFormatter = useMemo(() => {
    const fmt = new Intl.DateTimeFormat("en-US", rangeFormat[range]);
    return (value: number) => fmt.format(new Date(value * 1000));
  }, [range]);

  const points =
    history.points.length > 0
      ? history.points
      : totals.equityUsd > 0
        ? [
            { time: mountedAt - 86_400, equity: totals.equityUsd },
            { time: mountedAt, equity: totals.equityUsd },
          ]
        : [];

  const rangeChange =
    points.length > 1 ? points.at(-1)!.equity - points[0]!.equity : null;
  const up = (totals.change24hUsd ?? 0) >= 0;

  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">
            Total equity · {modeLabel}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-44" />
          ) : (
            <p className="font-heading text-2xl font-semibold tabular">
              {formatCurrency(totals.equityUsd)}
            </p>
          )}
          {loading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <p className={cn("text-xs tabular", up ? "text-buy" : "text-sell")}>
              {up ? "+" : ""}
              {formatCurrency(totals.change24hUsd)}
              {totals.changePct24h != null
                ? ` (${up ? "+" : ""}${totals.changePct24h.toFixed(2)}%)`
                : ""}{" "}
              <span className="text-muted-foreground">24h</span>
            </p>
          )}
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as EquityRange)}>
          <TabsList className="h-7">
            {(Object.keys(EQUITY_RANGES) as EquityRange[]).map((r) => (
              <TabsTrigger key={r} value={r} className="px-2 text-[11px]">
                {r}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-3 h-52">
        {loading || (history.isLoading && history.points.length === 0) ? (
          <Skeleton className="h-full w-full" />
        ) : points.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
            Your equity curve appears once you hold assets.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-full w-full"
          >
            <AreaChart
              data={points}
              margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient id="equity-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-equity)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-equity)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={tickFormatter}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis domain={["auto", "auto"]} hide />
              <ChartTooltip
                cursor
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const t = payload?.[0]?.payload?.time as
                        number | undefined;
                      return t ? new Date(t * 1000).toLocaleString() : "";
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Area
                dataKey="equity"
                type="monotone"
                stroke="var(--color-equity)"
                strokeWidth={1.5}
                fill="url(#equity-fill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">
        {rangeChange != null ? (
          <>
            {range} change{" "}
            <span
              className={cn(
                "tabular",
                rangeChange >= 0 ? "text-buy" : "text-sell",
              )}
            >
              {rangeChange >= 0 ? "+" : ""}
              {formatCurrency(rangeChange)}
            </span>{" "}
            ·{" "}
          </>
        ) : null}
        Estimated from current holdings × historical prices.
      </p>
    </section>
  );
}
