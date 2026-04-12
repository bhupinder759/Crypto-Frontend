export type ChartIndicatorType = "sma";

export type ChartIndicatorConfig = {
  id: string;
  type: ChartIndicatorType;
  length: number;
  color?: string;
};

export type HorizontalChartDrawing = {
  id: string;
  type: "horizontal";
  price: number;
  color?: string;
};

export type TrendChartDrawing = {
  id: string;
  type: "trend";
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
  color?: string;
};

export type ChartDrawingConfig = HorizontalChartDrawing | TrendChartDrawing;

export type ChartPreferenceDto = {
  symbol: string;
  interval: string;
  lastViewedTimestamp: number | null;
  indicatorConfig: ChartIndicatorConfig[];
  drawingConfig: ChartDrawingConfig[];
  updatedAt: string | null;
};

export type CandlePageDto = {
  items: import("@/modules/market/types/market-data").MarketData[];
  hasMore: boolean;
  nextBeforeTimestamp: number | null;
};
