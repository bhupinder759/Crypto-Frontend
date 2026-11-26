"use client";

import { apiGet, apiPut } from "@/lib/api/api-client";
import {
  normalizeCandle,
  normalizeOrderBook,
  normalizeTrades,
} from "@/modules/market/services/normalize";
import type {
  CandlePageResponseDto,
  ChartPreferenceResponseDto,
  InstrumentDto,
  OrderBookDto,
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

export async function getTrades(symbol: string, limit = 50): Promise<TradeDto[]> {
  return normalizeTrades(
    // Live tape (upstream + exchange fills), same source as the `trades` stream.
    await apiGet<unknown>("/market/trades", { symbol, limit, source: "external" }),
  );
}

export async function getCandlesPage(
  symbol: string,
  interval = "1m",
  limit = 120,
  beforeTimestamp?: number,
): Promise<CandlePageResponseDto> {
  const page = await apiGet<CandlePageResponseDto>("/market/candles", {
    symbol,
    interval,
    limit,
    ...(beforeTimestamp ? { beforeTimestamp } : {}),
  });
  // OHLCV arrive as decimal strings; charts and indicators need numbers.
  return { ...page, items: (page?.items ?? []).map(normalizeCandle) };
}

export async function getOrderBook(symbol: string): Promise<OrderBookDto | null> {
  return normalizeOrderBook(
    await apiGet<unknown>("/market/orderbook", { symbol }),
  );
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
