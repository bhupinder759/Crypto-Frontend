"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/page-header";
import { QueryErrorCard } from "@/components/common/query-error-card";
import { formatCompact, formatNumber } from "@/lib/utils/formatter";
import {
  useAdminOverviewQuery,
  useAdminUsersQuery,
} from "@/modules/admin/hooks/use-admin";
import {
  buildDailyVolume,
  buildUserGrowth,
  signupTrend,
} from "@/modules/admin/utils/analytics";
import { useSymbolsQuery } from "@/modules/market/hooks/use-market-data";
import { getCandlesPage } from "@/modules/market/services/market.api";
import { AdminKpis, type Kpi } from "./admin-kpis";
import { UserGrowthChart, VolumeChart } from "./admin-charts";
import { UsersTable } from "./users-table";
import { WithdrawalsQueue } from "./withdrawals-queue";

export function AdminOverview() {
  const overviewQuery = useAdminOverviewQuery();
  const usersQuery = useAdminUsersQuery();
  const symbolsQuery = useSymbolsQuery();
  const [now] = useState(() => Date.now());
  const overview = overviewQuery.data;

  const dailyCandles = useQueries({
    queries: (symbolsQuery.data ?? []).map((symbol) => ({
      queryKey: ["market", "candles", "range", symbol, "1d", 30] as const,
      queryFn: async () => (await getCandlesPage(symbol, "1d", 30)).items,
      staleTime: 10 * 60_000,
    })),
    combine: (results) => ({
      data: results.map((r) => r.data),
      loading: results.some((r) => r.isLoading),
    }),
  });

  const growth = useMemo(
    () => buildUserGrowth(usersQuery.data ?? [], 30, now),
    [now, usersQuery.data],
  );
  const volume = useMemo(
    () => buildDailyVolume(dailyCandles.data),
    [dailyCandles.data],
  );
  const trend = signupTrend(growth);
  const signups7d = growth.slice(-7).reduce((s, p) => s + p.signups, 0);

  const kpis: Kpi[] = [
    {
      label: "Users",
      value: overview ? formatNumber(overview.users, 0) : "--",
      trend,
      hint: `${signups7d} new this week`,
    },
    {
      label: "Accounts",
      value: overview ? formatNumber(overview.accounts, 0) : "--",
      hint: `${overview?.admins ?? "--"} admins`,
    },
    {
      label: "Open orders",
      value: overview ? formatNumber(overview.openOrders, 0) : "--",
      hint: `${overview ? formatCompact(overview.orders) : "--"} total`,
    },
    {
      label: "Trades 24h",
      value: overview ? formatNumber(overview.trades24h, 0) : "--",
      hint: `${overview?.activeSymbols ?? "--"} active pairs`,
    },
    {
      label: "Volume 24h",
      value: overview ? `$${formatCompact(overview.volume24hQuote)}` : "--",
      hint: `${overview?.deposits24h ?? "--"} deposits 24h`,
    },
    {
      label: "Pending withdrawals",
      value: overview ? formatNumber(overview.pendingWithdrawals, 0) : "--",
      hint: `${overview?.pendingOutbox ?? "--"} outbox events`,
      tone: overview && overview.pendingWithdrawals > 0 ? "warning" : undefined,
    },
  ];

  return (
    <div className="space-y-3">
      <PageHeader
        title="Admin"
        description="Users, order flow and withdrawal queue."
      />
      {overviewQuery.isError ? (
        <QueryErrorCard
          compact
          title="Couldn't load platform metrics"
          error={overviewQuery.error}
          onRetry={overviewQuery.refetch}
        />
      ) : null}
      <AdminKpis items={kpis} loading={overviewQuery.isLoading} />
      <div className="grid gap-3 lg:grid-cols-2">
        <UserGrowthChart points={growth} loading={usersQuery.isLoading} />
        <VolumeChart
          points={volume}
          loading={symbolsQuery.isLoading || dailyCandles.loading}
        />
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <UsersTable
          users={usersQuery.data ?? []}
          loading={usersQuery.isLoading}
          error={usersQuery.isError ? usersQuery.error : undefined}
          onRetry={usersQuery.refetch}
        />
        <WithdrawalsQueue />
      </div>
    </div>
  );
}
