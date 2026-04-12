"use client";

import { create } from "zustand";
import type { OrderBookDto, TradeDto } from "@/types/api.types";

type TradingStore = {
  realtimeBySymbol: Record<
    string,
    {
      internalOrderBook: OrderBookDto | null;
      externalOrderBook: OrderBookDto | null;
      trades: TradeDto[];
    }
  >;
  setInternalOrderBook: (symbol: string, orderBook: OrderBookDto) => void;
  setExternalOrderBook: (symbol: string, orderBook: OrderBookDto) => void;
  prependTrade: (symbol: string, trade: TradeDto) => void;
};

export const useTradingStore = create<TradingStore>((set) => ({
  realtimeBySymbol: {},
  setInternalOrderBook: (symbol, orderBook) =>
    set((state) => ({
      realtimeBySymbol: {
        ...state.realtimeBySymbol,
        [symbol]: {
          internalOrderBook: orderBook,
          externalOrderBook:
            state.realtimeBySymbol[symbol]?.externalOrderBook ?? null,
          trades: state.realtimeBySymbol[symbol]?.trades ?? [],
        },
      },
    })),
  setExternalOrderBook: (symbol, orderBook) =>
    set((state) => ({
      realtimeBySymbol: {
        ...state.realtimeBySymbol,
        [symbol]: {
          internalOrderBook:
            state.realtimeBySymbol[symbol]?.internalOrderBook ?? null,
          externalOrderBook: orderBook,
          trades: state.realtimeBySymbol[symbol]?.trades ?? [],
        },
      },
    })),
  prependTrade: (symbol, trade) =>
    set((state) => ({
      realtimeBySymbol: {
        ...state.realtimeBySymbol,
        [symbol]: {
          internalOrderBook:
            state.realtimeBySymbol[symbol]?.internalOrderBook ?? null,
          externalOrderBook:
            state.realtimeBySymbol[symbol]?.externalOrderBook ?? null,
          trades: [
            trade,
            ...(state.realtimeBySymbol[symbol]?.trades ?? []),
          ].slice(0, 50),
        },
      },
    })),
}));
