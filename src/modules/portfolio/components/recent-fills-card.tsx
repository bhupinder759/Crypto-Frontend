"use client";

import { QueryErrorCard } from "@/components/common/query-error-card";
import { Skeleton } from "@/components/ui/skeleton";
import { FillsTable } from "@/modules/orders/components/fills-table";
import { useFillsQuery } from "@/modules/trading/hooks/use-trading";

/** Latest own executions (REAL accounts only). */
export function RecentFillsCard({ accountId }: { accountId: string }) {
  const query = useFillsQuery(accountId, "REAL");

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex h-9 items-center border-b border-border px-3">
        <h2 className="text-xs font-medium">Recent fills</h2>
      </header>
      {query.isError ? (
        <QueryErrorCard
          compact
          className="m-3"
          title="Couldn't load fills"
          error={query.error}
          onRetry={query.refetch}
        />
      ) : query.isLoading ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <FillsTable
            fills={(query.data ?? []).slice(0, 8)}
            compact
            empty="No fills yet."
          />
        </div>
      )}
    </section>
  );
}
