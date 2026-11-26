"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { QueryErrorCard } from "@/components/common/query-error-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimestamp } from "@/lib/utils/formatter";
import type { AdminUserDto } from "@/modules/admin/types";

const PAGE_SIZE = 10;

export function UsersTable({
  users,
  loading,
  error,
  onRetry,
}: {
  users: AdminUserDto[];
  loading: boolean;
  error?: unknown;
  onRetry?: () => unknown;
}) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (role === "ALL" || u.role === role) &&
        (!q || u.email.toLowerCase().includes(q) || u.id.includes(q)),
    );
  }, [query, role, users]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(
    current * PAGE_SIZE,
    current * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <h2 className="mr-auto text-xs font-medium">Users</h2>
        <div className="flex gap-0.5 rounded-md bg-muted p-0.5 text-[11px]">
          {(["ALL", "USER", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setPage(0);
              }}
              className={
                r === role
                  ? "rounded bg-background px-2 py-0.5"
                  : "px-2 py-0.5 text-muted-foreground"
              }
            >
              {r === "ALL" ? "All" : r === "USER" ? "Users" : "Admins"}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search email or ID"
            aria-label="Search users"
            className="h-8 pl-7 text-xs"
          />
        </div>
      </header>
      {error ? (
        <QueryErrorCard
          compact
          className="m-3"
          title="Couldn't load users"
          error={error}
          onRetry={onRetry}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-xs">
            <thead>
              <tr className="border-b border-border text-[11px] text-muted-foreground">
                <th className="h-7 px-3 text-left font-normal">Email</th>
                <th className="px-2 text-left font-normal">Role</th>
                <th className="px-2 text-left font-normal">Joined</th>
                <th className="px-3 text-left font-normal">Last session</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="h-9 border-b border-border/60">
                      <td colSpan={4} className="px-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                : rows.map((u) => (
                    <tr
                      key={u.id}
                      className="h-9 border-b border-border/60 last:border-0"
                    >
                      <td className="px-3">
                        <p className="font-medium">{u.email}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {u.id}
                        </p>
                      </td>
                      <td className="px-2">
                        <Badge
                          variant={u.role === "ADMIN" ? "warning" : "muted"}
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-2 text-muted-foreground">
                        {formatTimestamp(u.createdAt)}
                      </td>
                      <td className="px-3 text-muted-foreground">
                        {u.lastSessionAt
                          ? formatTimestamp(u.lastSessionAt)
                          : "Never"}
                      </td>
                    </tr>
                  ))}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No users match.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
      <footer className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
        <span className="tabular">
          {filtered.length === 0 ? 0 : current * PAGE_SIZE + 1}–
          {Math.min(filtered.length, (current + 1) * PAGE_SIZE)} of{" "}
          {filtered.length}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Previous page"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft />
          </Button>
          <span className="tabular">
            {current + 1}/{pages}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Next page"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </footer>
    </section>
  );
}
