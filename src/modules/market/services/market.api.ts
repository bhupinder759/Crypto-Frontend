"use client";

import { apiGet } from "@/lib/api/api-client";
import type {
  CandleDto,
  InstrumentDto,
  OrderBookDto,
  TickerDto,
  TradeDto,
} from "@/types/api.types";

export function getSymbols() {
  return apiGet<string[]>("/market/symbols");
}

export function getInstruments(symbol?: string) {
  return apiGet<InstrumentDto[] | InstrumentDto | null>("/market/instruments", symbol ? { symbol } : undefined);
}

export function getTicker(symbol: string) {
  return apiGet<TickerDto>("/market/ticker", { symbol });
}

export function getTrades(symbol: string, limit = 50) {
  return apiGet<TradeDto[]>("/market/trades", { symbol, limit });
}

export function getCandles(symbol: string, interval = "1m", limit = 60) {
  return apiGet<CandleDto[]>("/market/candles", { symbol, interval, limit });
}

export function getOrderBook(symbol: string) {
  return apiGet<OrderBookDto | null>("/market/orderbook", { symbol });
}
