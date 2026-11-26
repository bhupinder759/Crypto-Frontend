"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Inline error state for a failed query with a retry button.
 * Use instead of silently rendering `data ?? []`.
 */
export function QueryErrorCard({
  title = "Couldn't load data",
  error,
  onRetry,
  retrying = false,
  className,
  compact = false,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => unknown;
  retrying?: boolean;
  className?: string;
  compact?: boolean;
}) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Something went wrong. Please try again.";

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-md border border-sell/25 bg-sell/5 text-center",
        compact ? "px-3 py-4" : "px-4 py-8",
        className,
      )}
    >
      <AlertTriangle className="size-5 text-sell" />
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="max-w-sm text-xs text-muted-foreground">{message}</p>
      </div>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={retrying}
          onClick={() => void onRetry()}
        >
          <RotateCw className={cn("size-3.5", retrying && "animate-spin")} />
          {retrying ? "Retrying…" : "Retry"}
        </Button>
      ) : null}
    </div>
  );
}
