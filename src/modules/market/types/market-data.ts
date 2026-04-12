export type MarketDataProvider = "binance" | "twelve-data";
export type MarketType = "crypto" | "forex";

export interface MarketData {
  symbol: string;
  interval: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  provider: MarketDataProvider;
  marketType: MarketType;
  isClosed: boolean;
  eventTime: number;
}
