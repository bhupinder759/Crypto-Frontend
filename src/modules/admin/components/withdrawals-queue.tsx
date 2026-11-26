"use client";

import { useState } from "react";
import { QueryErrorCard } from "@/components/common/query-error-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatTimestamp } from "@/lib/utils/formatter";
import {
  useAdminPendingWithdrawalsQuery,
  useApproveWithdrawalMutation,
  useRejectWithdrawalMutation,
} from "@/modules/admin/hooks/use-admin";
import type { AdminPendingWithdrawalDto } from "@/modules/admin/types";

const QUICK_REASONS = [
  "Address failed screening",
  "Suspicious activity",
  "KYC required",
  "Duplicate request",
];

export function WithdrawalsQueue() {
  const query = useAdminPendingWithdrawalsQuery();
  const approve = useApproveWithdrawalMutation();
  const reject = useRejectWithdrawalMutation();
  const [target, setTarget] = useState<AdminPendingWithdrawalDto | null>(null);
  const [reason, setReason] = useState("");
  const busyId = approve.isPending
    ? approve.variables
    : reject.isPending
      ? reject.variables?.id
      : null;
  const items = query.data ?? [];

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex h-9 items-center justify-between border-b border-border px-3">
        <h2 className="text-xs font-medium">Withdrawal queue</h2>
        <span className="text-[11px] text-muted-foreground tabular">
          {items.length} pending
        </span>
      </header>
      {query.isError ? (
        <QueryErrorCard
          compact
          className="m-3"
          title="Couldn't load withdrawals"
          error={query.error}
          onRetry={query.refetch}
        />
      ) : query.isLoading ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          Queue is clear.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((w) => (
            <li
              key={w.id}
              className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium tabular">
                  {formatCurrency(Number(w.amount))}
                </p>
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {w.address} · user {w.userId.slice(0, 8)} ·{" "}
                  {formatTimestamp(w.createdAt)}
                </p>
              </div>
              <Button
                size="xs"
                className="bg-buy text-buy-foreground hover:bg-buy/90"
                disabled={busyId === w.id}
                onClick={() => approve.mutate(w.id)}
              >
                Approve
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={busyId === w.id}
                onClick={() => setTarget(w)}
              >
                Reject
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={target != null}
        onOpenChange={(open) => {
          if (!open) {
            setTarget(null);
            setReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject withdrawal</DialogTitle>
            <DialogDescription>
              {target
                ? `${formatCurrency(Number(target.amount))} to ${target.address}`
                : ""}
              . Funds return to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-1">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
              >
                {r}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <Label htmlFor="reject-reason" className="text-xs">
              Reason (shown to the user)
            </Label>
            <Textarea
              id="reject-reason"
              value={reason}
              maxLength={200}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-20 text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={reason.trim().length < 3 || reject.isPending}
              onClick={() => {
                if (!target) return;
                reject.mutate(
                  { id: target.id, reason: reason.trim() },
                  {
                    onSuccess: () => {
                      setTarget(null);
                      setReason("");
                    },
                  },
                );
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
