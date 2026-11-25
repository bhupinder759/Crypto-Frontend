"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
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
import { QueryErrorCard } from "@/components/common/query-error-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  decimalsFromIncrement,
  decimalsFromPrice,
  formatFixed,
} from "@/lib/utils/precision";
import {
  useChartPreferenceQuery,
  useInfiniteCandlesQuery,
  useInstrumentQuery,
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
import { readChartPalette } from "@/modules/market/utils/chart-theme";

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
  persistPreferences = true,
  showTools = true,
  bare = false,
  toolbar,
}: {
  symbol: string;
  interval: string;
  title?: string;
  height?: number;
  onLiveCandle?: (candle: MarketData) => void;
  /** Sync focus/indicators/drawings to the user's saved preferences (needs auth). */
  persistPreferences?: boolean;
  showTools?: boolean;
  /** Borderless, fills its parent's height (trading terminal). */
  bare?: boolean;
  /** Extra controls rendered at the left of the bare toolbar (e.g. intervals). */
  toolbar?: React.ReactNode;
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

  const { resolvedTheme } = useTheme();
  const instrumentQuery = useInstrumentQuery(symbol);
  const preferenceQuery = useChartPreferenceQuery(
    symbol,
    interval,
    persistPreferences,
  );
  const updatePreferenceMutation = useUpdateChartPreferenceMutation();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteCandlesQuery(symbol, interval);

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
  const priceDecimals = instrumentQuery.data?.priceIncrement
    ? decimalsFromIncrement(instrumentQuery.data.priceIncrement)
    : decimalsFromPrice(currentPrice);

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

    const palette = readChartPalette();
    const chart = createChart(container, {
      autoSize: true,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: palette.text,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: palette.grid },
        horzLines: { color: palette.grid },
      },
      crosshair: {
        vertLine: { color: palette.crosshair },
        horzLine: { color: palette.crosshair },
      },
      rightPriceScale: {
        borderColor: palette.border,
      },
      timeScale: {
        borderColor: palette.border,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: palette.up,
      downColor: palette.down,
      wickUpColor: palette.up,
      wickDownColor: palette.down,
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

  // Re-read CSS variables whenever the theme flips.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const chart = chartRef.current;
      const series = seriesRef.current;
      if (!chart || !series) return;
      const palette = readChartPalette();
      chart.applyOptions({
        layout: { textColor: palette.text },
        grid: {
          vertLines: { color: palette.grid },
          horzLines: { color: palette.grid },
        },
        crosshair: {
          vertLine: { color: palette.crosshair },
          horzLine: { color: palette.crosshair },
        },
        rightPriceScale: { borderColor: palette.border },
        timeScale: { borderColor: palette.border },
      });
      series.applyOptions({
        upColor: palette.up,
        downColor: palette.down,
        wickUpColor: palette.up,
        wickDownColor: palette.down,
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [resolvedTheme]);

  useEffect(() => {
    seriesRef.current?.applyOptions({
      priceFormat: {
        type: "price",
        precision: priceDecimals,
        minMove: 1 / 10 ** priceDecimals,
      },
    });
  }, [priceDecimals]);

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
    if (
      !persistPreferences ||
      !workspace.hydrated ||
      workspace.lastViewedTimestamp == null
    ) {
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
    persistPreferences,
    updatePreferenceMutation,
    workspace.hydrated,
    workspace.lastViewedTimestamp,
  ]);

  useEffect(() => {
    if (!persistPreferences || !workspace.hydrated) {
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
    persistPreferences,
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

  const toolButtons = (
    <>
      <Button
        type="button"
        variant={
          workspace.indicatorConfig.some((item) => item.id === "sma-20")
            ? "default"
            : "outline"
        }
        size={bare ? "xs" : "sm"}
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
        size={bare ? "xs" : "sm"}
        onClick={() => toggleSmaIndicator(key, 50)}
      >
        SMA 50
      </Button>
      <Button
        type="button"
        variant="outline"
        size={bare ? "xs" : "sm"}
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
        size={bare ? "xs" : "sm"}
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
    </>
  );

  if (bare) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {showTools || toolbar ? (
          <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1">
            {toolbar}
            {showTools ? (
              <div className="ml-auto flex flex-wrap items-center gap-1">
                {toolButtons}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="relative min-h-0 w-full flex-1 overflow-hidden">
          <div ref={containerRef} className="absolute inset-0" />
          {chartCandles.length === 0 && (isLoading || isError) ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80">
              {isError ? (
                <QueryErrorCard
                  compact
                  title="Market history unavailable"
                  error={error}
                  onRetry={refetch}
                />
              ) : (
                <span className="text-xs text-muted-foreground">
                  Loading market history…
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

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
            <div className="text-sm font-medium text-foreground tabular">
              {lastCandle ? formatFixed(lastCandle.close, priceDecimals) : "--"}
            </div>
            <div className="text-xs text-muted-foreground">
              {isConnected ? "Live" : "Reconnecting…"}
            </div>
          </div>
        </div>
        <div className={showTools ? "flex flex-wrap gap-2" : "hidden"}>
          {toolButtons}
          {workspace.lastViewedTimestamp ? (
            <div className="self-center text-xs text-muted-foreground">
              Focused candle:{" "}
              {new Date(workspace.lastViewedTimestamp * 1000).toLocaleString()}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative w-full" style={{ height }}>
          <div ref={containerRef} className="absolute inset-0" />
          {chartCandles.length === 0 && (isLoading || isError) ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80">
              {isError ? (
                <QueryErrorCard
                  compact
                  title="Market history unavailable"
                  error={error}
                  onRetry={refetch}
                />
              ) : (
                <span className="text-xs text-muted-foreground">
                  Loading market history…
                </span>
              )}
            </div>
          ) : null}
        </div>
        <div
          className={
            showTools
              ? "flex items-center justify-between text-xs text-muted-foreground"
              : "hidden"
          }
        >
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
