"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  reconnectMarketSocket,
  useMarketSocketStatus,
  type MarketSocketStatus,
} from "@/modules/market/hooks/use-market-socket";

const statusMeta: Record<
  MarketSocketStatus,
  { label: string; dot: string; text: string; hint: string }
> = {
  connected: {
    label: "Live",
    dot: "bg-buy",
    text: "text-buy",
    hint: "Market data stream connected",
  },
  connecting: {
    label: "Connecting",
    dot: "bg-warning animate-pulse",
    text: "text-warning",
    hint: "Connecting to market data",
  },
  reconnecting: {
    label: "Reconnecting",
    dot: "bg-warning animate-pulse",
    text: "text-warning",
    hint: "Connection lost, retrying",
  },
  offline: {
    label: "Offline",
    dot: "bg-sell",
    text: "text-sell",
    hint: "Market data unavailable. Click to retry.",
  },
};

export function ConnectionStatus({ compact = false }: { compact?: boolean }) {
  const status = useMarketSocketStatus();
  const meta = statusMeta[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={reconnectMarketSocket}
          aria-label={`Connection: ${meta.label}`}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-xs font-medium",
            meta.text,
          )}
        >
          <span className={cn("size-1.5 rounded-full", meta.dot)} />
          {compact ? null : <span>{meta.label}</span>}
        </button>
      </TooltipTrigger>
      <TooltipContent>{meta.hint}</TooltipContent>
    </Tooltip>
  );
}
