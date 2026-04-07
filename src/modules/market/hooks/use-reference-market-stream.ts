"use client";

import { useEffect, useState } from "react";
import {
  getSyntheticRealtimeSnapshot,
  isReferenceCryptoSymbol,
} from "@/lib/market/reference-market";
import type { OrderBookDto, TickerDto, TradeDto } from "@/types/api.types";

type ReferenceRealtimeState = {
  marketSymbol: string | null;
  ticker: TickerDto | null;
  orderBook: OrderBookDto | null;
  trades: TradeDto[];
};

const EMPTY_STATE: ReferenceRealtimeState = {
  marketSymbol: null,
  ticker: null,
  orderBook: null,
  trades: [],
};

export function useReferenceMarketStream(symbol: string) {
  const [state, setState] = useState<ReferenceRealtimeState>(EMPTY_STATE);

  useEffect(() => {
    if (!symbol || !isReferenceCryptoSymbol(symbol)) {
      return;
    }

    const applySnapshot = () => {
      const snapshot = getSyntheticRealtimeSnapshot(symbol);
      if (!snapshot) {
        return;
      }

      setState({
        marketSymbol: symbol,
        ticker: snapshot.ticker,
        orderBook: snapshot.orderBook,
        trades: snapshot.trades,
      });
    };

    const timeout = window.setTimeout(applySnapshot, 0);
    const interval = window.setInterval(applySnapshot, 2_500);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [symbol]);

  return state.marketSymbol === symbol ? state : EMPTY_STATE;
}
