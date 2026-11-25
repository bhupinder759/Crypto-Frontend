"use client";

import { create } from "zustand";
import type { MarketData } from "@/modules/market/types/market-data";
import type { OrderBookDto, TradeDto } from "@/types/api.types";

const MAX_TRADES = 60;

type SymbolRealtime = {
  /** Book from the exchange's own engine (raw `/ws`). */
  internalOrderBook: OrderBookDto | null;
  /** Book from the socket.io market stream. */
  externalOrderBook: OrderBookDto | null;
  trades: TradeDto[];
  lastCandle: MarketData | null;
};

const EMPTY: SymbolRealtime = {
  internalOrderBook: null,
  externalOrderBook: null,
  trades: [],
  lastCandle: null,
};

type TradingStore = {
  realtimeBySymbol: Record<string, SymbolRealtime>;
  setInternalOrderBook: (symbol: string, orderBook: OrderBookDto) => void;
  setExternalOrderBook: (symbol: string, orderBook: OrderBookDto) => void;
  prependTrade: (symbol: string, trade: TradeDto) => void;
  setLastCandle: (symbol: string, candle: MarketData) => void;
};

function patch(
  state: TradingStore,
  symbol: string,
  next: Partial<SymbolRealtime>,
): Pick<TradingStore, "realtimeBySymbol"> {
  return {
    realtimeBySymbol: {
      ...state.realtimeBySymbol,
      [symbol]: { ...(state.realtimeBySymbol[symbol] ?? EMPTY), ...next },
    },
  };
}

export const useTradingStore = create<TradingStore>((set) => ({
  realtimeBySymbol: {},
  setInternalOrderBook: (symbol, orderBook) =>
    set((state) => patch(state, symbol, { internalOrderBook: orderBook })),
  setExternalOrderBook: (symbol, orderBook) =>
    set((state) => patch(state, symbol, { externalOrderBook: orderBook })),
  prependTrade: (symbol, trade) =>
    set((state) => {
      const current = state.realtimeBySymbol[symbol]?.trades ?? [];
      if (current.some((item) => item.id === trade.id)) return state;
      return patch(state, symbol, {
        trades: [trade, ...current].slice(0, MAX_TRADES),
      });
    }),
  setLastCandle: (symbol, candle) =>
    set((state) => patch(state, symbol, { lastCandle: candle })),
}));
