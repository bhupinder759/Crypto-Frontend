"use client";

import { Area, Bar, BarChart, ComposedChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompact } from "@/lib/utils/formatter";
import type { GrowthPoint, VolumePoint } from "@/modules/admin/utils/analytics";

const dayFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const fmtDay = (v: number) => dayFmt.format(new Date(v));

const growthConfig = {
  total: { label: "Total users", color: "var(--chart-2)" },
  signups: { label: "Signups", color: "var(--chart-1)" },
} satisfies ChartConfig;
const volumeConfig = {
  volume: { label: "Volume (USD)", color: "var(--chart-3)" },
} satisfies ChartConfig;

function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <h2 className="text-xs font-medium">{title}</h2>
      <div className="mt-2 h-44">{children}</div>
      <p className="mt-1 text-[10px] text-muted-foreground">{note}</p>
    </section>
  );
}

export function UserGrowthChart({
  points,
  loading,
}: {
  points: GrowthPoint[];
  loading: boolean;
}) {
  return (
    <Panel title="User growth · 30d" note="From user sign-up dates.">
      {loading ? (
        <Skeleton className="h-full w-full" />
      ) : (
        <ChartContainer
          config={growthConfig}
          className="aspect-auto h-full w-full"
        >
          <ComposedChart
            data={points}
            margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
          >
            <XAxis
              dataKey="day"
              tickFormatter={fmtDay}
              tickLine={false}
              axisLine={false}
              minTickGap={32}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, p) => fmtDay(p?.[0]?.payload?.day ?? 0)}
                />
              }
            />
            <YAxis yAxisId="total" hide />
            <YAxis yAxisId="signups" hide orientation="right" />
            <Area
              yAxisId="total"
              dataKey="total"
              type="monotone"
              stroke="var(--color-total)"
              fill="var(--color-total)"
              fillOpacity={0.15}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
            <Bar
              yAxisId="signups"
              dataKey="signups"
              fill="var(--color-signups)"
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      )}
    </Panel>
  );
}

export function VolumeChart({
  points,
  loading,
}: {
  points: VolumePoint[];
  loading: boolean;
}) {
  return (
    <Panel
      title="Market volume · 30d"
      note="Daily quote volume across listed pairs (reference market data)."
    >
      {loading ? (
        <Skeleton className="h-full w-full" />
      ) : points.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          No volume data
        </div>
      ) : (
        <ChartContainer
          config={volumeConfig}
          className="aspect-auto h-full w-full"
        >
          <BarChart
            data={points}
            margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
          >
            <XAxis
              dataKey="day"
              tickFormatter={fmtDay}
              tickLine={false}
              axisLine={false}
              minTickGap={32}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, p) => fmtDay(p?.[0]?.payload?.day ?? 0)}
                  formatter={(v) => `$${formatCompact(Number(v))}`}
                />
              }
            />
            <Bar
              dataKey="volume"
              fill="var(--color-volume)"
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      )}
    </Panel>
  );
}
