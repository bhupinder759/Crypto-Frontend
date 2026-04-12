"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-card p-1">
      <Button
        type="button"
        variant={activeMode === "REAL" ? "default" : "ghost"}
        size="sm"
        disabled={!realAccount || mutation.isPending}
        onClick={() => mutation.mutate("REAL")}
      >
        Real
      </Button>
      <Button
        type="button"
        variant={activeMode === "DEMO" ? "default" : "ghost"}
        size="sm"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate("DEMO")}
      >
        Demo
      </Button>
    </div>
  );
}
