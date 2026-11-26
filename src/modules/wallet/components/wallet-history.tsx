"use client";

import { QueryErrorCard } from "@/components/common/query-error-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatTimestamp } from "@/lib/utils/formatter";
import {
  useDepositsQuery,
  useWithdrawalsQuery,
} from "@/modules/wallet/hooks/use-wallet";
import { REQUIRED_CONFIRMATIONS } from "@/modules/wallet/utils/withdrawal";
import {
  StatusTimeline,
  depositSteps,
  withdrawalSteps,
} from "./status-timeline";

function Rows({
  loading,
  empty,
  children,
}: {
  loading: boolean;
  empty: boolean;
  children: React.ReactNode;
}) {
  if (loading)
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  if (empty)
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">
        Nothing here yet.
      </p>
    );
  return <ul className="divide-y divide-border/60">{children}</ul>;
}

export function WalletHistory() {
  const deposits = useDepositsQuery();
  const withdrawals = useWithdrawalsQuery();

  return (
    <section className="rounded-lg border border-border bg-card">
      <Tabs defaultValue="deposits" className="gap-0">
        <TabsList
          variant="line"
          className="h-9 w-full justify-start border-b border-border px-3"
        >
          <TabsTrigger value="deposits" className="flex-none text-xs">
            Deposits
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex-none text-xs">
            Withdrawals
          </TabsTrigger>
        </TabsList>
        <TabsContent value="deposits">
          {deposits.isError ? (
            <QueryErrorCard
              compact
              className="m-3"
              title="Couldn't load deposits"
              error={deposits.error}
              onRetry={deposits.refetch}
            />
          ) : (
            <Rows
              loading={deposits.isLoading}
              empty={(deposits.data ?? []).length === 0}
            >
              {(deposits.data ?? []).map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-xs"
                >
                  <span className="w-24 font-medium tabular text-buy">
                    +{formatCurrency(Number(d.amount))}
                  </span>
                  <StatusTimeline
                    steps={depositSteps(
                      d.confirmations,
                      d.confirmed,
                      REQUIRED_CONFIRMATIONS,
                    )}
                  />
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {formatTimestamp(d.createdAt)}
                  </span>
                  <span className="w-full truncate font-mono text-[10px] text-muted-foreground">
                    {d.txHash}
                  </span>
                </li>
              ))}
            </Rows>
          )}
        </TabsContent>
        <TabsContent value="withdrawals">
          {withdrawals.isError ? (
            <QueryErrorCard
              compact
              className="m-3"
              title="Couldn't load withdrawals"
              error={withdrawals.error}
              onRetry={withdrawals.refetch}
            />
          ) : (
            <Rows
              loading={withdrawals.isLoading}
              empty={(withdrawals.data ?? []).length === 0}
            >
              {(withdrawals.data ?? []).map((w) => (
                <li
                  key={w.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-xs"
                >
                  <span className="w-24 font-medium tabular">
                    −{formatCurrency(Number(w.amount))}
                  </span>
                  <StatusTimeline steps={withdrawalSteps(w.status)} />
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {formatTimestamp(w.updatedAt)}
                  </span>
                  <span className="w-full truncate font-mono text-[10px] text-muted-foreground">
                    {w.address}
                    {w.error ? (
                      <span className="ml-2 text-destructive">{w.error}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </Rows>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
