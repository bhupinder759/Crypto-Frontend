"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { AccountDto, TradingMode } from "@/modules/auth/types";
import { useTradingModeMutation } from "@/modules/trading/hooks/use-trading-mode";
import { useTradingModeStore } from "@/modules/trading/store/trading-mode.store";

export function TradingModeToggle({
  initialMode,
  realAccount,
  demoAccount,
}: {
  initialMode: TradingMode;
  realAccount: AccountDto | null;
  demoAccount: AccountDto | null;
}) {
  const mutation = useTradingModeMutation();
  const mode = useTradingModeStore((state) => state.mode);
  const hydrated = useTradingModeStore((state) => state.hydrated);
  const setContext = useTradingModeStore((state) => state.setContext);

  useEffect(() => {
    setContext({
      mode: initialMode,
      realAccount,
      demoAccount,
    });
  }, [demoAccount, initialMode, realAccount, setContext]);

  const activeMode = hydrated ? mode : initialMode;

  const options: { value: TradingMode; label: string; disabled: boolean }[] = [
    { value: "DEMO", label: "Demo", disabled: false },
    { value: "REAL", label: "Real", disabled: !realAccount },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Trading mode"
      className="flex h-7 items-center rounded-md border border-border bg-card p-0.5 text-xs"
    >
      {options.map((option) => {
        const active = activeMode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={option.disabled || mutation.isPending}
            title={option.disabled ? "No real account yet" : undefined}
            onClick={() => !active && mutation.mutate(option.value)}
            className={cn(
              "h-full rounded-[5px] px-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? option.value === "DEMO"
                  ? "bg-warning/15 text-warning"
                  : "bg-buy/15 text-buy"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
