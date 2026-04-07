"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tradingApi } from "@/lib/api/trading";

interface TradingOrderFormProps {
  accountId: string;
  symbol: string;
  currentPrice: number;
}

export const TradingOrderForm = ({
  accountId,
  symbol,
  currentPrice,
}: TradingOrderFormProps) => {
  const queryClient = useQueryClient();
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(currentPrice.toString());

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await tradingApi.createOrder({
        accountId,
        symbol,
        side,
        type: orderType,
        quantity,
        price: orderType === "LIMIT" ? price : undefined,
      });
      return response.data;
    },
    onSuccess: (order) => {
      // Auto-execute for demo accounts
      if (accountId.includes("DEMO")) {
        executeMutation.mutate({
          orderId: order.id,
          executionPrice: orderType === "LIMIT" ? price : currentPrice.toString(),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["account-stats", accountId] });
      resetForm();
    },
  });

  const executeMutation = useMutation({
    mutationFn: async ({ orderId, executionPrice }: { orderId: string; executionPrice: string }) => {
      const response = await tradingApi.executeOrder(orderId, executionPrice);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-stats", accountId] });
    },
  });

  const resetForm = () => {
    setQuantity("");
    setPrice(currentPrice.toString());
  };

  const totalValue = quantity ? (parseFloat(quantity) * parseFloat(price)).toFixed(2) : "0.00";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || parseFloat(quantity) <= 0) {
      alert("Please enter a valid quantity");
      return;
    }
    if (orderType === "LIMIT" && (!price || parseFloat(price) <= 0)) {
      alert("Please enter a valid price for limit orders");
      return;
    }
    createOrderMutation.mutate();
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">Place Order</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Type */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Order Type
          </label>
          <div className="flex gap-2">
            {(["MARKET", "LIMIT"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  orderType === type
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Side */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Side
          </label>
          <div className="flex gap-2">
            {(["BUY", "SELL"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  side === s
                    ? s === "BUY"
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Symbol */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Symbol
          </label>
          <input
            type="text"
            value={symbol}
            disabled
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white opacity-50"
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Quantity
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Price */}
        {orderType === "LIMIT" ? (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Price
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Current Price
            </label>
            <div className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white">
              ${currentPrice.toFixed(2)}
            </div>
          </div>
        )}

        {/* Total Value */}
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <p className="text-slate-400 text-sm">Order Value</p>
          <p className="text-white text-xl font-bold">${totalValue}</p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            createOrderMutation.isPending ||
            executeMutation.isPending ||
            !quantity
          }
          className={`w-full px-4 py-3 rounded-lg font-bold text-white transition ${
            side === "BUY"
              ? "bg-green-600 hover:bg-green-700 disabled:opacity-50"
              : "bg-red-600 hover:bg-red-700 disabled:opacity-50"
          }`}
        >
          {createOrderMutation.isPending || executeMutation.isPending
            ? "Processing..."
            : `${side === "BUY" ? "Buy" : "Sell"} ${quantity} ${symbol}`}
        </button>
      </form>
    </div>
  );
};
