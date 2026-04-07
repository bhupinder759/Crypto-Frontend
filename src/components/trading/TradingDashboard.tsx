"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { tradingApi } from "@/lib/api/trading";
import { LiveChart } from "@/components/common/LiveChart";
import { TradingOrderForm } from "./TradingOrderForm";
import { AccountSelector } from "./AccountSelector";

interface TradingDashboardProps {
  userId: string;
}

export const TradingDashboard = ({ userId }: TradingDashboardProps) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTC/USD");
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  // Fetch account stats
  const { data: stats } = useQuery({
    queryKey: ["account-stats", selectedAccountId],
    queryFn: () => tradingApi.getAccountStats(selectedAccountId),
    enabled: !!selectedAccountId,
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Fetch current price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(
          `/api/v1/market/live-price?symbol=${selectedSymbol}`
        );
        if (response.ok) {
          const data = await response.json();
          setCurrentPrice(data.price);
        }
      } catch (error) {
        console.error("Failed to fetch price:", error);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Trading Dashboard</h1>
          <p className="text-slate-400">
            Trade crypto with demo paper trading or real accounts
          </p>
        </div>

        {/* Account Selector */}
        <AccountSelector userId={userId} />

        {selectedAccountId && (
          <>
            {/* Account Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm font-medium mb-2">
                    Portfolio Value
                  </p>
                  <p className="text-2xl font-bold text-white">
                    ${parseFloat(stats.portfolioValue).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Balance: ${parseFloat(stats.balance).toFixed(2)}
                  </p>
                </div>

                <div className={`bg-gradient-to-br rounded-lg p-4 border ${
                  stats.unrealizedPnL >= 0
                    ? "from-green-900 to-slate-900 border-green-700"
                    : "from-red-900 to-slate-900 border-red-700"
                }`}>
                  <p className="text-slate-400 text-sm font-medium mb-2">
                    Unrealized P&L
                  </p>
                  <p className={`text-2xl font-bold ${
                    stats.unrealizedPnL >= 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    ${parseFloat(stats.unrealizedPnL).toFixed(2)}
                  </p>
                </div>

                <div className={`bg-gradient-to-br rounded-lg p-4 border ${
                  stats.realizedPnL >= 0
                    ? "from-blue-900 to-slate-900 border-blue-700"
                    : "from-slate-800 to-slate-900 border-slate-700"
                }`}>
                  <p className="text-slate-400 text-sm font-medium mb-2">
                    Realized P&L
                  </p>
                  <p className={`text-2xl font-bold ${
                    stats.realizedPnL >= 0 ? "text-blue-400" : "text-slate-400"
                  }`}>
                    ${parseFloat(stats.realizedPnL).toFixed(2)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm font-medium mb-2">
                    Open Positions
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {stats.openPositions}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm font-medium mb-2">
                    Total Trades
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalTrades}
                  </p>
                </div>
              </div>
            )}

            {/* Main Trading Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="lg:col-span-2">
                <LiveChart
                  symbol={selectedSymbol}
                  timeframe="5m"
                  onCandleUpdate={(candle) => {
                    // Update selected price when candles update
                    setCurrentPrice(candle.close);
                  }}
                />
              </div>

              {/* Order Form */}
              <div>
                <TradingOrderForm
                  accountId={selectedAccountId}
                  symbol={selectedSymbol}
                  currentPrice={currentPrice}
                />

                {/* Symbol Selector */}
                <div className="mt-6 bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Select Trading Pair
                  </label>
                  <select
                    value={selectedSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white hover:border-slate-500 transition"
                  >
                    <option value="BTC/USD">Bitcoin (BTC/USD)</option>
                    <option value="ETH/USD">Ethereum (ETH/USD)</option>
                    <option value="ADA/USD">Cardano (ADA/USD)</option>
                    <option value="SOL/USD">Solana (SOL/USD)</option>
                    <option value="XRP/USD">Ripple (XRP/USD)</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Info Box */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-3">Getting Started</h3>
          <ul className="text-slate-400 space-y-2 text-sm">
            <li>✓ Create a Demo Account to practice with $10,000 virtual funds</li>
            <li>✓ Create a Real Account to trade with actual capital</li>
            <li>✓ Choose your trading pair and timeframe</li>
            <li>✓ Place Market or Limit orders</li>
            <li>✓ Monitor your positions and P&L in real-time</li>
            <li>✓ API calls are rate-limited using CoinGecko free tier</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
