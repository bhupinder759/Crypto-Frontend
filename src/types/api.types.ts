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

export interface CandleDto {
  id: string;
  symbol: string;
  interval: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  openTime: string;
  closeTime: string;
}

export interface TradeDto {
  id: string;
  symbol: string;
  price: string;
  quantity: string;
  buyOrderId: string;
  sellOrderId: string;
  timestamp: string;
}

export interface OrderBookDto {
  symbol: string;
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
}
