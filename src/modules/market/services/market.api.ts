"use client";

import { apiGet, apiPut } from "@/lib/api/api-client";
import type {
  CandlePageResponseDto,
  ChartPreferenceResponseDto,
  InstrumentDto,
  OrderBookDto,
  TickerDto,
  TradeDto,
} from "@/types/api.types";
import type {
  ChartDrawingConfig,
  ChartIndicatorConfig,
} from "@/modules/market/types/chart-workspace";

export function getSymbols() {
  return apiGet<string[]>("/market/symbols");
}

export function getInstruments(symbol?: string) {
  return apiGet<InstrumentDto[] | InstrumentDto | null>(
    "/market/instruments",
    symbol ? { symbol } : undefined,
  );
}

export function getTicker(symbol: string) {
  return apiGet<TickerDto>("/market/ticker", { symbol });
}

export function getTrades(symbol: string, limit = 50) {
  return apiGet<TradeDto[]>("/market/trades", { symbol, limit });
}

export function getCandlesPage(
  symbol: string,
  interval = "1m",
  limit = 120,
  beforeTimestamp?: number,
) {
  return apiGet<CandlePageResponseDto>("/market/candles", {
    symbol,
    interval,
    limit,
    ...(beforeTimestamp ? { beforeTimestamp } : {}),
  });
}

export function getOrderBook(symbol: string) {
  return apiGet<OrderBookDto | null>("/market/orderbook", { symbol });
}

export function getChartPreference(symbol: string, interval: string) {
  return apiGet<ChartPreferenceResponseDto>("/preferences/chart-view", {
    symbol,
    interval,
  });
}

export async function updateChartPreference(payload: {
  symbol: string;
  interval: string;
  lastViewedTimestamp?: number;
  indicatorConfig?: ChartIndicatorConfig[];
  drawingConfig?: ChartDrawingConfig[];
}) {
  return apiPut<ChartPreferenceResponseDto, typeof payload>(
    "/preferences/chart-view",
    payload,
  );
}
