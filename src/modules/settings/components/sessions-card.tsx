"use client";

import { Monitor } from "lucide-react";
import { QueryErrorCard } from "@/components/common/query-error-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimestamp } from "@/lib/utils/formatter";
import {
  describeUserAgent,
  useRevokeSession,
  useSessionsQuery,
} from "@/modules/settings/security";

export function SessionsCard() {
  const query = useSessionsQuery();
  const revoke = useRevokeSession();
  const sessions = (query.data ?? [])
    .slice()
    .sort((a, b) => Number(b.current) - Number(a.current));

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-3 py-2.5">
        <h2 className="text-sm font-medium">Active sessions</h2>
        <p className="text-[11px] text-muted-foreground">
          Devices signed in to your account. Sign out any you don&apos;t
          recognise.
        </p>
      </header>
      {query.isError ? (
        <QueryErrorCard
          compact
          className="m-3"
          title="Couldn't load sessions"
          error={query.error}
          onRetry={query.refetch}
        />
      ) : query.isLoading ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No active sessions.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-xs"
            >
              <Monitor className="size-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium">
                  {describeUserAgent(s.userAgent)}
                  {s.current ? (
                    <Badge variant="success">This device</Badge>
                  ) : null}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {s.ip ?? "Unknown IP"} · signed in{" "}
                  {formatTimestamp(s.createdAt)}
                  {s.lastUsedAt
                    ? ` · active ${formatTimestamp(s.lastUsedAt)}`
                    : ""}
                </p>
              </div>
              {s.current ? null : (
                <Button
                  size="xs"
                  variant="outline"
                  disabled={revoke.isPending && revoke.variables === s.id}
                  onClick={() => revoke.mutate(s.id)}
                >
                  Sign out
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
