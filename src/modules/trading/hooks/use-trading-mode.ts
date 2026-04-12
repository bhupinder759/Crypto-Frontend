"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { TradingMode } from "@/modules/auth/types";
import {
  applyDemoFaucet,
  setTradingMode,
} from "@/modules/trading/services/trading-mode.api";
import { useTradingModeStore } from "@/modules/trading/store/trading-mode.store";

export function useTradingModeMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const setContext = useTradingModeStore((state) => state.setContext);

  return useMutation({
    mutationFn: (mode: TradingMode) => setTradingMode(mode),
    onSuccess: (context) => {
      setContext({
        mode: context.activeMode,
        realAccount: context.realAccount,
        demoAccount: context.demoAccount,
      });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      router.refresh();
      toast.success(`Switched to ${context.activeMode.toLowerCase()} mode`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDemoFaucetMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const setContext = useTradingModeStore((state) => state.setContext);

  return useMutation({
    mutationFn: applyDemoFaucet,
    onSuccess: (payload) => {
      setContext({
        mode: payload.context.activeMode,
        realAccount: payload.context.realAccount,
        demoAccount: payload.context.demoAccount,
      });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      router.refresh();
      toast.success(payload.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
