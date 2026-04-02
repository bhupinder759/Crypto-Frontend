"use client";

import { create } from "zustand";
import type { OrderBookDto, TradeDto } from "@/types/api.types";

type TradingStore = {
  realtimeBySymbol: Record<
    string,
    {
      orderBook: OrderBookDto | null;
      trades: TradeDto[];
    }
  >;
  setOrderBook: (symbol: string, orderBook: OrderBookDto) => void;
  prependTrade: (symbol: string, trade: TradeDto) => void;
};

export const useTradingStore = create<TradingStore>((set) => ({
  realtimeBySymbol: {},
  setOrderBook: (symbol, orderBook) =>
    set((state) => ({
      realtimeBySymbol: {
        ...state.realtimeBySymbol,
        [symbol]: {
          orderBook,
          trades: state.realtimeBySymbol[symbol]?.trades ?? [],
        },
      },
    })),
  prependTrade: (symbol, trade) =>
    set((state) => ({
      realtimeBySymbol: {
        ...state.realtimeBySymbol,
        [symbol]: {
          orderBook: state.realtimeBySymbol[symbol]?.orderBook ?? null,
          trades: [trade, ...(state.realtimeBySymbol[symbol]?.trades ?? [])].slice(
            0,
            50,
          ),
        },
      },
    })),
}));
