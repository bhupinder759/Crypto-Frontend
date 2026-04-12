"use client";

import { create } from "zustand";
import type { AccountDto, TradingMode } from "@/modules/auth/types";

type TradingModeState = {
  mode: TradingMode;
  realAccount: AccountDto | null;
  demoAccount: AccountDto | null;
  hydrated: boolean;
  setContext: (payload: {
    mode: TradingMode;
    realAccount: AccountDto | null;
    demoAccount: AccountDto | null;
  }) => void;
};

export const useTradingModeStore = create<TradingModeState>((set) => ({
  mode: "REAL",
  realAccount: null,
  demoAccount: null,
  hydrated: false,
  setContext: ({ mode, realAccount, demoAccount }) =>
    set({
      mode,
      realAccount,
      demoAccount,
      hydrated: true,
    }),
}));
