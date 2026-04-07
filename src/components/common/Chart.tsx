"use client";
import { useState } from "react";
import { Line, Chart as ReactChart } from "react-chartjs-2";
import { useQuery } from "@tanstack/react-query";
import { getIntradayData } from "@/lib/alpha-vantage";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import { CandlestickController, OhlcElement } from "chartjs-chart-financial";
import "chartjs-adapter-luxon";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  CandlestickController,
  OhlcElement,
);

const symbols = ["IBM", "MSFT", "GOOG"];
type ChartType = "line" | "candlestick";

export const Chart = () => {
  const [symbol, setSymbol] = useState(symbols[0]);
  const [chartType, setChartType] = useState<ChartType>("line");

  const { data, isLoading } = useQuery({
    queryKey: ["intraday-data", symbol],
    queryFn: () => getIntradayData(symbol),
  });

  const chartData: any = {
    datasets: [
      {
        label: symbol,
        data:
          data && data["Time Series (5min)"]
            ? Object.keys(data["Time Series (5min)"]).map((key) => {
                const item: any = data["Time Series (5min)"][key];
                return chartType === "line"
                  ? { x: new Date(key), y: parseFloat(item["4. close"]) }
                  : {
                      x: new Date(key).valueOf(),
                      o: parseFloat(item["1. open"]),
                      h: parseFloat(item["2. high"]),
                      l: parseFloat(item["3. low"]),
                      c: parseFloat(item["4. close"]),
                    };
              })
            : [],
      },
    ],
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="p-2 border rounded"
        >
          {symbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value as ChartType)}
          className="p-2 border rounded"
        >
          <option value="line">Line</option>
          <option value="candlestick">Candlestick</option>
        </select>
      </div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-center mb-4">
            {symbol} Intraday Data
          </h2>
          <ReactChart type={chartType} data={chartData} />
        </>
      )}
    </div>
  );
};
