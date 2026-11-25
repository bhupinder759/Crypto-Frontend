import type { MarketData } from "@/modules/market/types/market-data";
import type {
  CandlePageDto,
  ChartPreferenceDto,
} from "@/modules/market/types/chart-workspace";

export interface ApiErrorPayload {
  message: string;
  statusCode?: number;
  error?: string;
}

export interface TickerDto {
  symbol: string;
  lastPrice: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  priceChange24h: string;
}

export interface InstrumentDto {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  minQuantity: string;
  quantityIncrement: string;
  priceIncrement: string;
  supportedOrderTypes: Array<"LIMIT" | "MARKET">;
  allowMarketBuy: boolean;
}

export type CandleDto = MarketData;
export type CandlePageResponseDto = CandlePageDto;
export type ChartPreferenceResponseDto = ChartPreferenceDto;

export interface TradeDto {
  id: string;
  symbol: string;
  price: string;
  quantity: string;
  buyOrderId: string;
  sellOrderId: string;
  timestamp: string;
  /** Taker side when the backend provides it. */
  side?: "BUY" | "SELL";
}

export interface OrderBookDto {
  symbol: string;
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
  /** "internal" = exchange engine, "external" = upstream reference book. */
  source?: "internal" | "external";
}

/** Live ticker (REST `/market/tickers`, Socket.IO `tickers` / `ticker`). */
export interface MarketTickerDto {
  symbol: string;
  lastPrice: string;
  open24h: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  quoteVolume24h: string;
  priceChange24h: string;
  priceChangePercent24h: string;
  eventTime: number;
  source: "binance" | "internal" | string;
}
