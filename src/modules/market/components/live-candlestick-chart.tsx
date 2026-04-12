"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  LineSeries,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
} from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useChartPreferenceQuery,
  useInfiniteCandlesQuery,
  useUpdateChartPreferenceMutation,
} from "@/modules/market/hooks/use-market-data";
import { useMarketSocket } from "@/modules/market/hooks/use-market-socket";
import {
  DEFAULT_CHART_WORKSPACE,
  getChartWorkspaceKey,
  useChartWorkspaceStore,
} from "@/modules/market/store/chart-workspace.store";
import type {
  ChartDrawingConfig,
  ChartIndicatorConfig,
} from "@/modules/market/types/chart-workspace";
import type { MarketData } from "@/modules/market/types/market-data";

type CandlestickPoint = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
};

type LinePoint = {
  time: Time;
  value: number;
};

type TrendAnchor = {
  time: number;
  price: number;
};

function toChartPoint(candle: MarketData): CandlestickPoint {
  return {
    time: candle.time as Time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
}

function dedupeCandles(candles: MarketData[]): MarketData[] {
  const uniqueByTime = new Map<number, MarketData>();

  for (const candle of candles) {
    uniqueByTime.set(candle.time, candle);
  }

  return Array.from(uniqueByTime.values()).sort(
    (left, right) => left.time - right.time,
  );
}

function mergeLiveCandle(
  candles: MarketData[],
  liveCandle: MarketData | null,
  symbol: string,
  interval: string,
) {
  if (
    !liveCandle ||
    liveCandle.symbol !== symbol ||
    liveCandle.interval !== interval
  ) {
    return candles;
  }

  return dedupeCandles([...candles, liveCandle]);
}

function toTimestamp(time: Time | undefined): number | null {
  if (typeof time === "number") {
    return time;
  }

  if (!time || typeof time !== "object") {
    return null;
  }

  if ("timestamp" in time && typeof time.timestamp === "number") {
    return time.timestamp;
  }

  return null;
}

function getClickPrice(
  param: MouseEventParams<Time>,
  series: ISeriesApi<"Candlestick"> | null,
): number | null {
  if (!series) {
    return null;
  }

  const seriesData = param.seriesData.get(series);
  if (
    !seriesData ||
    typeof seriesData !== "object" ||
    !("close" in seriesData)
  ) {
    return null;
  }

  return typeof seriesData.close === "number" ? seriesData.close : null;
}

function buildSmaSeries(candles: MarketData[], length: number): LinePoint[] {
  if (candles.length < length) {
    return [];
  }

  const result: LinePoint[] = [];
  let rollingSum = 0;

  for (let index = 0; index < candles.length; index += 1) {
    rollingSum += candles[index]?.close ?? 0;

    if (index >= length) {
      rollingSum -= candles[index - length]?.close ?? 0;
    }

    if (index >= length - 1) {
      result.push({
        time: candles[index]!.time as Time,
        value: rollingSum / length,
      });
    }
  }

  return result;
}

function chartPreferencesSignature(
  indicators: ChartIndicatorConfig[],
  drawings: ChartDrawingConfig[],
) {
  return JSON.stringify({
    indicators,
    drawings,
  });
}

export function LiveCandlestickChart({
  symbol,
  interval,
  title = "Price Action",
  height = 420,
  onLiveCandle,
}: {
  symbol: string;
  interval: string;
  title?: string;
  height?: number;
  onLiveCandle?: (candle: MarketData) => void;
}) {
  const key = getChartWorkspaceKey(symbol, interval);
  const { socketRef, isConnected } = useMarketSocket(symbol, interval);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const loadingOlderRef = useRef(false);
  const indicatorSeriesRef = useRef<ISeriesApi<"Line">[]>([]);
  const drawingSeriesRef = useRef<ISeriesApi<"Line">[]>([]);
  const horizontalLinesRef = useRef<IPriceLine[]>([]);
  const hasNextPageRef = useRef(false);
  const pendingTrendAnchorRef = useRef<TrendAnchor | null>(null);
  const hasAlignedInitialRangeRef = useRef(false);
  const lastSavedTimestampRef = useRef<number | null>(null);
  const lastSavedPreferenceSignatureRef = useRef<string>("");
  const [liveCandle, setLiveCandle] = useState<MarketData | null>(null);

  const workspace = useChartWorkspaceStore(
    (state) => state.workspaces[key] ?? DEFAULT_CHART_WORKSPACE,
  );
  const hydrateWorkspace = useChartWorkspaceStore(
    (state) => state.hydrateWorkspace,
  );
  const setLastViewedTimestamp = useChartWorkspaceStore(
    (state) => state.setLastViewedTimestamp,
  );
  const toggleSmaIndicator = useChartWorkspaceStore(
    (state) => state.toggleSmaIndicator,
  );
  const addHorizontalLine = useChartWorkspaceStore(
    (state) => state.addHorizontalLine,
  );
  const startTrendLine = useChartWorkspaceStore(
    (state) => state.startTrendLine,
  );
  const completeTrendLine = useChartWorkspaceStore(
    (state) => state.completeTrendLine,
  );
  const clearPendingTrendLine = useChartWorkspaceStore(
    (state) => state.clearPendingTrendLine,
  );

  const preferenceQuery = useChartPreferenceQuery(symbol, interval);
  const updatePreferenceMutation = useUpdateChartPreferenceMutation();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteCandlesQuery(symbol, interval);

  const candles = useMemo(
    () => dedupeCandles(data?.pages.flatMap((page) => page.items) ?? []),
    [data?.pages],
  );
  const chartCandles = useMemo(
    () => mergeLiveCandle(candles, liveCandle, symbol, interval),
    [candles, interval, liveCandle, symbol],
  );
  const lastCandle = chartCandles[chartCandles.length - 1] ?? null;
  const currentPrice = lastCandle?.close ?? null;

  useEffect(() => {
    hasNextPageRef.current = Boolean(hasNextPage);
  }, [hasNextPage]);

  useEffect(() => {
    pendingTrendAnchorRef.current = workspace.pendingTrendAnchor;
  }, [workspace.pendingTrendAnchor]);

  useEffect(() => {
    if (!preferenceQuery.data) {
      return;
    }

    lastSavedTimestampRef.current = preferenceQuery.data.lastViewedTimestamp;
    lastSavedPreferenceSignatureRef.current = chartPreferencesSignature(
      preferenceQuery.data.indicatorConfig,
      preferenceQuery.data.drawingConfig,
    );
    hydrateWorkspace(key, {
      lastViewedTimestamp: preferenceQuery.data.lastViewedTimestamp,
      indicatorConfig: preferenceQuery.data.indicatorConfig,
      drawingConfig: preferenceQuery.data.drawingConfig,
    });
  }, [hydrateWorkspace, key, preferenceQuery.data]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || chartRef.current) {
      return;
    }

    const chart = createChart(container, {
      autoSize: true,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.08)" },
        horzLines: { color: "rgba(148, 163, 184, 0.08)" },
      },
      crosshair: {
        vertLine: { color: "rgba(56, 189, 248, 0.35)" },
        horzLine: { color: "rgba(56, 189, 248, 0.35)" },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.18)",
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.18)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
      borderVisible: false,
      priceLineVisible: true,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (
        !range ||
        range.from > 15 ||
        loadingOlderRef.current ||
        !hasNextPageRef.current
      ) {
        return;
      }

      loadingOlderRef.current = true;
      void fetchNextPage().finally(() => {
        loadingOlderRef.current = false;
      });
    });

    chart.subscribeClick((param) => {
      const timestamp = toTimestamp(param.time);
      const price = getClickPrice(param, seriesRef.current);

      if (!timestamp) {
        return;
      }

      setLastViewedTimestamp(key, timestamp);

      if (pendingTrendAnchorRef.current && price !== null) {
        completeTrendLine(key, { time: timestamp, price });
        return;
      }
    });

    resizeObserverRef.current = new ResizeObserver(() => {
      chart.applyOptions({ height: container.clientHeight || height });
    });
    resizeObserverRef.current.observe(container);

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      indicatorSeriesRef.current.forEach((seriesApi) => {
        chart.removeSeries(seriesApi);
      });
      drawingSeriesRef.current.forEach((seriesApi) => {
        chart.removeSeries(seriesApi);
      });
      horizontalLinesRef.current.forEach((line) => {
        series.removePriceLine(line);
      });
      indicatorSeriesRef.current = [];
      drawingSeriesRef.current = [];
      horizontalLinesRef.current = [];
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [
    completeTrendLine,
    fetchNextPage,
    height,
    interval,
    key,
    setLastViewedTimestamp,
    symbol,
  ]);

  useEffect(() => {
    if (!seriesRef.current) {
      return;
    }

    seriesRef.current.setData(chartCandles.map(toChartPoint));

    if (!hasAlignedInitialRangeRef.current && chartCandles.length > 0) {
      if (workspace.lastViewedTimestamp == null) {
        chartRef.current?.timeScale().fitContent();
        hasAlignedInitialRangeRef.current = true;
      }
    }
  }, [chartCandles, workspace.lastViewedTimestamp]);

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) {
      return;
    }

    indicatorSeriesRef.current.forEach((seriesApi) => {
      chartRef.current?.removeSeries(seriesApi);
    });
    indicatorSeriesRef.current = [];

    for (const indicator of workspace.indicatorConfig) {
      if (indicator.type !== "sma") {
        continue;
      }

      const lineSeries = chartRef.current.addSeries(LineSeries, {
        color: indicator.color ?? "#38bdf8",
        lineWidth: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      lineSeries.setData(buildSmaSeries(chartCandles, indicator.length));
      indicatorSeriesRef.current.push(lineSeries);
    }
  }, [chartCandles, workspace.indicatorConfig]);

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) {
      return;
    }

    drawingSeriesRef.current.forEach((seriesApi) => {
      chartRef.current?.removeSeries(seriesApi);
    });
    drawingSeriesRef.current = [];

    horizontalLinesRef.current.forEach((line) => {
      seriesRef.current?.removePriceLine(line);
    });
    horizontalLinesRef.current = [];

    for (const drawing of workspace.drawingConfig) {
      if (drawing.type === "horizontal") {
        const priceLine = seriesRef.current.createPriceLine({
          price: drawing.price,
          color: drawing.color ?? "#f97316",
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "H",
        });
        horizontalLinesRef.current.push(priceLine);
        continue;
      }

      const trendSeries = chartRef.current.addSeries(LineSeries, {
        color: drawing.color ?? "#a855f7",
        lineWidth: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      trendSeries.setData([
        {
          time: drawing.startTime as Time,
          value: drawing.startPrice,
        },
        {
          time: drawing.endTime as Time,
          value: drawing.endPrice,
        },
      ]);
      drawingSeriesRef.current.push(trendSeries);
    }
  }, [workspace.drawingConfig]);

  useEffect(() => {
    if (!workspace.hydrated || workspace.lastViewedTimestamp == null) {
      return;
    }

    if (lastSavedTimestampRef.current === workspace.lastViewedTimestamp) {
      return;
    }

    const timeout = window.setTimeout(() => {
      lastSavedTimestampRef.current = workspace.lastViewedTimestamp;
      updatePreferenceMutation.mutate({
        symbol,
        interval,
        lastViewedTimestamp: workspace.lastViewedTimestamp ?? undefined,
      });
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    interval,
    symbol,
    updatePreferenceMutation,
    workspace.hydrated,
    workspace.lastViewedTimestamp,
  ]);

  useEffect(() => {
    if (!workspace.hydrated) {
      return;
    }

    const nextSignature = chartPreferencesSignature(
      workspace.indicatorConfig,
      workspace.drawingConfig,
    );

    if (lastSavedPreferenceSignatureRef.current === nextSignature) {
      return;
    }

    const timeout = window.setTimeout(() => {
      lastSavedPreferenceSignatureRef.current = nextSignature;
      updatePreferenceMutation.mutate({
        symbol,
        interval,
        indicatorConfig: workspace.indicatorConfig,
        drawingConfig: workspace.drawingConfig,
      });
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    interval,
    symbol,
    updatePreferenceMutation,
    workspace.drawingConfig,
    workspace.hydrated,
    workspace.indicatorConfig,
  ]);

  useEffect(() => {
    if (
      !chartRef.current ||
      workspace.lastViewedTimestamp == null ||
      chartCandles.length === 0
    ) {
      return;
    }

    const firstTimestamp = chartCandles[0]?.time ?? null;
    if (
      firstTimestamp !== null &&
      workspace.lastViewedTimestamp < firstTimestamp &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
      return;
    }

    const targetIndex = chartCandles.findIndex(
      (candle) => candle.time >= workspace.lastViewedTimestamp!,
    );

    if (targetIndex < 0) {
      return;
    }

    chartRef.current.timeScale().setVisibleLogicalRange({
      from: Math.max(targetIndex - 25, 0),
      to: targetIndex + 25,
    });
    hasAlignedInitialRangeRef.current = true;
  }, [
    chartCandles,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    workspace.lastViewedTimestamp,
  ]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    const handleLiveCandle = (payload: MarketData) => {
      if (payload.symbol !== symbol || payload.interval !== interval) {
        return;
      }

      seriesRef.current?.update(toChartPoint(payload));
      setLiveCandle(payload);
      onLiveCandle?.(payload);
    };

    socket.on("live_candle", handleLiveCandle);

    return () => {
      socket.off("live_candle", handleLiveCandle);
    };
  }, [interval, onLiveCandle, socketRef, symbol]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {symbol} · {interval} candlesticks
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-foreground">
              {lastCandle ? lastCandle.close.toFixed(4) : "--"}
            </div>
            <div className="text-xs text-muted-foreground">
              {isConnected ? "Socket connected" : "Socket reconnecting"}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={
              workspace.indicatorConfig.some((item) => item.id === "sma-20")
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() => toggleSmaIndicator(key, 20)}
          >
            SMA 20
          </Button>
          <Button
            type="button"
            variant={
              workspace.indicatorConfig.some((item) => item.id === "sma-50")
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() => toggleSmaIndicator(key, 50)}
          >
            SMA 50
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPrice == null}
            onClick={() => {
              if (currentPrice == null) {
                return;
              }

              addHorizontalLine(key, { price: currentPrice });
            }}
          >
            Horizontal Line
          </Button>
          <Button
            type="button"
            variant={workspace.pendingTrendAnchor ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (workspace.pendingTrendAnchor) {
                clearPendingTrendLine(key);
                return;
              }

              const anchorCandle = lastCandle;
              if (!anchorCandle) {
                return;
              }

              startTrendLine(key, {
                time: anchorCandle.time,
                price: anchorCandle.close,
              });
            }}
          >
            {workspace.pendingTrendAnchor ? "Cancel Trend" : "Trend Line"}
          </Button>
          {workspace.lastViewedTimestamp ? (
            <div className="self-center text-xs text-muted-foreground">
              Focused candle:{" "}
              {new Date(workspace.lastViewedTimestamp * 1000).toLocaleString()}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && chartCandles.length === 0 ? (
          <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
            Loading market history...
          </div>
        ) : (
          <div ref={containerRef} style={{ height }} className="w-full" />
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {workspace.pendingTrendAnchor
              ? "Trend mode active. Click a second candle to place the line."
              : "Click a candle to save focus. Scroll left to load older history."}
          </span>
          {isFetchingNextPage ? <span>Loading older candles...</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
