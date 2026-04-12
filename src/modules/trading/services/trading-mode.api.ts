"use client";

import { apiGet, apiPost, apiPut } from "@/lib/api/api-client";
import type { TradingMode, TradingModeContextDto } from "@/modules/auth/types";

export function getTradingMode() {
  return apiGet<TradingModeContextDto>("/trading-mode");
}

export function setTradingMode(mode: TradingMode) {
  return apiPut<TradingModeContextDto, { mode: TradingMode }>("/trading-mode", {
    mode,
  });
}

export function applyDemoFaucet(payload: {
  amount: string;
  operation: "ADD" | "SET";
  asset?: string;
}) {
  return apiPost<
    {
      message: string;
      balance: {
        id: string;
        accountId: string;
        asset: string;
        available: string;
        reserved: string;
        total: string;
      };
      context: TradingModeContextDto;
    },
    typeof payload
  >("/demo/faucet", payload);
}
