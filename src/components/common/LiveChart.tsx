"use client";
import { useEffect, useState, useRef } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from "chart.js";
import "chartjs-adapter-luxon";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface LiveChartProps {
  symbol: string;
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
  onCandleUpdate?: (candle: CandleData) => void;
}

const cryptoSymbols = ["BTC/USD", "ETH/USD", "ADA/USD", "SOL/USD", "XRP/USD"];

export const LiveChart = ({ 
  symbol = "BTC/USD", 
  timeframe = "5m",
  onCandleUpdate 
}: LiveChartProps) => {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const chartRef = useRef(null);

  // Fetch initial candles
  useEffect(() => {
    const fetchCandles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/market/candles?symbol=${selectedSymbol}&timeframe=${selectedTimeframe}&limit=50`
        );
        if (response.ok) {
          const data = await response.json();
          setCandles(data);
          if (data.length > 0) {
            setCurrentPrice(data[data.length - 1].close);
          }
        }
      } catch (error) {
        console.error("Failed to fetch candles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandles();
  }, [selectedSymbol, selectedTimeframe]);

  // WebSocket connection for live updates
  useEffect(() => {
    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(
        `${protocol}//${window.location.host}/ws/market`
      );

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            action: "subscribe",
            symbol: selectedSymbol,
            timeframe: selectedTimeframe,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "candle_update") {
            setCandles((prev) => {
              const newCandles = [...prev];
              const lastCandle = newCandles[newCandles.length - 1];

              if (
                lastCandle &&
                Math.floor(lastCandle.time / 1000) ===
                  Math.floor(data.candle.time / 1000)
              ) {
                newCandles[newCandles.length - 1] = data.candle;
              } else {
                newCandles.push(data.candle);
              }

              if (newCandles.length > 100) {
                newCandles.shift();
              }

              return newCandles;
            });

            const newPrice = data.candle.close;
            const oldPrice = candles[candles.length - 1]?.close || newPrice;
            setCurrentPrice(newPrice);
            setPriceChange(((newPrice - oldPrice) / oldPrice) * 100);

            if (onCandleUpdate) {
              onCandleUpdate(data.candle);
            }
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      return ws;
    };

    const ws = connectWebSocket();

    return () => {
      if (ws) {
        ws.send(
          JSON.stringify({
            action: "unsubscribe",
            symbol: selectedSymbol,
            timeframe: selectedTimeframe,
          })
        );
        ws.close();
      }
    };
  }, [selectedSymbol, selectedTimeframe, candles, onCandleUpdate]);

  // Prepare chart data
  const chartData = {
    labels: candles.map((c) => new Date(c.time * 1000).toLocaleString()),
    datasets: [
      {
        label: `${selectedSymbol} (${selectedTimeframe})`,
        data: candles.map((c) => ({
          x: c.time * 1000,
          y: c.close,
        })),
        borderColor: candles.length > 0 && candles[candles.length - 1].close >= candles[0].close ? "#10b981" : "#ef4444",
        backgroundColor: candles.length > 0 && candles[candles.length - 1].close >= candles[0].close
          ? "rgba(16, 185, 129, 0.1)"
          : "rgba(239, 68, 68, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  };

  const volumeData = {
    labels: candles.map((c) => new Date(c.time * 1000).toLocaleString()),
    datasets: [
      {
        label: "Volume",
        data: candles.map((c) => c.volume),
        backgroundColor: candles.map((c) =>
          c.close >= c.open ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)"
        ),
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: `Price (${selectedSymbol})`,
        },
      },
      x: {
        type: "time" as const,
      },
    },
  };

  return (
    <div className="w-full bg-slate-900 rounded-lg border border-slate-700 p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{selectedSymbol}</h2>
            <p className="text-sm text-slate-400">Live Market Data</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">${currentPrice.toFixed(2)}</p>
            <p
              className={`text-lg font-semibold ${
                priceChange >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Symbol
            </label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white hover:border-slate-500 transition"
            >
              {cryptoSymbols.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Timeframe
            </label>
            <select
              value={selectedTimeframe}
              onChange={(e) =>
                setSelectedTimeframe(e.target.value as any)
              }
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white hover:border-slate-500 transition"
            >
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="4h">4 Hours</option>
              <option value="1d">1 Day</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Status
            </label>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="text-slate-400">Loading chart data...</div>
        </div>
      ) : candles.length > 0 ? (
        <div className="space-y-8">
          {/* Price Chart */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Price Chart</h3>
            <div style={{ height: "400px", position: "relative" }}>
              <Line ref={chartRef} data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Volume Chart */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Volume</h3>
            <div style={{ height: "200px", position: "relative" }}>
              <Bar data={volumeData} options={chartOptions} />
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {candles.length > 0 && (
              <>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-slate-400 text-sm font-medium">High</p>
                  <p className="text-white text-xl font-bold mt-2">
                    ${Math.max(...candles.map((c) => c.high)).toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-slate-400 text-sm font-medium">Low</p>
                  <p className="text-white text-xl font-bold mt-2">
                    ${Math.min(...candles.map((c) => c.low)).toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-slate-400 text-sm font-medium">Avg Price</p>
                  <p className="text-white text-xl font-bold mt-2">
                    ${(candles.reduce((sum, c) => sum + c.close, 0) / candles.length).toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-slate-400 text-sm font-medium">Total Volume</p>
                  <p className="text-white text-xl font-bold mt-2">
                    {(candles.reduce((sum, c) => sum + c.volume, 0) / 1000000).toFixed(2)}M
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="h-96 flex items-center justify-center">
          <div className="text-slate-400">No data available</div>
        </div>
      )}
    </div>
  );
};
