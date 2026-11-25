"use client";

import { create } from "zustand";
import type { MarketTickerDto } from "@/types/api.types";

type TickersState = {
  bySymbol: Record<string, MarketTickerDto>;
  merge: (tickers: MarketTickerDto[]) => void;
};

/** Live tickers keyed by symbol (REST snapshot + Socket.IO deltas, newest wins). */
export const useTickersStore = create<TickersState>((set) => ({
  bySymbol: {},
  merge: (tickers) =>
    set((state) => {
      if (tickers.length === 0) return state;
      const next = { ...state.bySymbol };
      let changed = false;
      for (const ticker of tickers) {
        const current = next[ticker.symbol];
        if (current && current.eventTime > ticker.eventTime) continue;
        next[ticker.symbol] = ticker;
        changed = true;
      }
      return changed ? { bySymbol: next } : state;
    }),
}));
