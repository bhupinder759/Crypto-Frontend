"use client";

import { useState } from "react";
import { BellPlus, Trash2 } from "lucide-react";
import { QueryErrorCard } from "@/components/common/query-error-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { isDecimalString } from "@/lib/utils/decimal";
import { formatTimestamp } from "@/lib/utils/formatter";
import { decimalsFromPrice, formatFixed } from "@/lib/utils/precision";
import { useSymbolsQuery } from "@/modules/market/hooks/use-market-data";
import { useLiveTickers } from "@/modules/market/hooks/use-market-overview";
import {
  MAX_ACTIVE_ALERTS,
  inferCondition,
  useAlertsQuery,
  useCreateAlert,
  useDeleteAlert,
} from "./alerts";

/** Create form, reusable in Settings and the trading terminal. */
export function AlertForm({
  defaultSymbol,
  onCreated,
}: {
  defaultSymbol?: string;
  onCreated?: () => void;
}) {
  const symbols = useSymbolsQuery().data ?? [];
  const tickers = useLiveTickers();
  const create = useCreateAlert();
  const [symbol, setSymbol] = useState(defaultSymbol ?? "BTC-USD");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const last = tickers[symbol] ? Number(tickers[symbol].lastPrice) : null;
  const condition = inferCondition(price, last);
  const valid = isDecimalString(price, 8) && Number(price) > 0;

  return (
    <form
      className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid) return;
        create.mutate(
          { symbol, condition, price, ...(note ? { note } : {}) },
          {
            onSuccess: () => {
              setPrice("");
              setNote("");
              onCreated?.();
            },
          },
        );
      }}
    >
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Market</Label>
        <Select value={symbol} onValueChange={setSymbol}>
          <SelectTrigger size="sm" className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(symbols.length ? symbols : [symbol]).map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label
          htmlFor="alert-price"
          className="text-[11px] text-muted-foreground"
        >
          Price{" "}
          {price && valid
            ? `(${condition === "ABOVE" ? "rises to" : "falls to"})`
            : ""}
        </Label>
        <Input
          id="alert-price"
          inputMode="decimal"
          value={price}
          placeholder={
            last != null
              ? formatFixed(last, decimalsFromPrice(last)).replace(/,/g, "")
              : "0.00"
          }
          onChange={(e) => setPrice(e.target.value.replace(",", "."))}
          className="h-8 text-xs tabular"
        />
      </div>
      <div className="space-y-1">
        <Label
          htmlFor="alert-note"
          className="text-[11px] text-muted-foreground"
        >
          Note (optional)
        </Label>
        <Input
          id="alert-note"
          value={note}
          maxLength={120}
          onChange={(e) => setNote(e.target.value)}
          className="h-8 text-xs"
        />
      </div>
      <Button
        type="submit"
        size="sm"
        className="h-8"
        disabled={!valid || create.isPending}
      >
        <BellPlus /> Add alert
      </Button>
    </form>
  );
}

export function AlertsCard() {
  const query = useAlertsQuery();
  const remove = useDeleteAlert();
  // Deleting an alert cancels it server-side; cancelled ones are history noise.
  const alerts = (query.data ?? []).filter((a) => a.status !== "CANCELLED");
  const active = alerts.filter((a) => a.status === "ACTIVE");

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div>
          <h2 className="text-sm font-medium">Price alerts</h2>
          <p className="text-[11px] text-muted-foreground">
            Get notified when a market crosses your price. {active.length}/
            {MAX_ACTIVE_ALERTS} active.
          </p>
        </div>
      </header>
      <div className="border-b border-border p-3">
        <AlertForm />
      </div>
      {query.isError ? (
        <QueryErrorCard
          compact
          className="m-3"
          title="Couldn't load alerts"
          error={query.error}
          onRetry={query.refetch}
        />
      ) : query.isLoading ? (
        <div className="p-3">
          <Skeleton className="h-10 w-full" />
        </div>
      ) : alerts.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No alerts yet.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {alerts.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center gap-3 px-3 py-2 text-xs"
            >
              <span className="w-20 font-medium">{a.symbol}</span>
              <span className="tabular">
                {a.condition === "ABOVE" ? "≥" : "≤"} {a.price}
              </span>
              <Badge
                variant={
                  a.status === "ACTIVE"
                    ? "info"
                    : a.status === "TRIGGERED"
                      ? "success"
                      : "muted"
                }
              >
                {a.status}
              </Badge>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {a.status === "TRIGGERED" && a.triggeredAt
                  ? `Hit ${a.triggeredPrice ?? ""} · ${formatTimestamp(a.triggeredAt)}`
                  : (a.note ?? "")}
              </span>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={`Delete alert ${a.symbol} ${a.price}`}
                onClick={() => remove.mutate(a.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
