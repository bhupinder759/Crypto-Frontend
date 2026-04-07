import { useEffect, useState, useCallback, useRef } from "react";
import io, { Socket } from "socket.io-client";

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface UseMarketWebSocketOptions {
  url?: string;
  symbol: string;
  timeframe: string;
  autoConnect?: boolean;
}

export const useMarketWebSocket = ({
  url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001",
  symbol,
  timeframe,
  autoConnect = true,
}: UseMarketWebSocketOptions) => {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Initialize connection
  useEffect(() => {
    if (!autoConnect) return;

    setIsLoading(true);

    const socket = io(url, {
      path: "/ws/market",
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected");
      setIsConnected(true);

      // Subscribe to updates
      socket.emit("subscribe", { symbol, timeframe });
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    socket.on("initial_candles", (data: { symbol: string; candles: CandleData[] }) => {
      if (data.symbol === symbol) {
        setCandles(data.candles);
        if (data.candles.length > 0) {
          setCurrentPrice(data.candles[data.candles.length - 1].close);
        }
        setIsLoading(false);
      }
    });

    socket.on("candle_update", (data: { symbol: string; timeframe: string; candle: CandleData }) => {
      if (data.symbol === symbol && data.timeframe === timeframe) {
        setCandles((prev) => {
          const newCandles = [...prev];
          const lastCandle = newCandles[newCandles.length - 1];

          if (lastCandle && Math.floor(lastCandle.time / 60) === Math.floor(data.candle.time / 60)) {
            newCandles[newCandles.length - 1] = data.candle;
          } else {
            newCandles.push(data.candle);
          }

          if (newCandles.length > 100) {
            newCandles.shift();
          }

          return newCandles;
        });

        setCurrentPrice(data.candle.close);
      }
    });

    socket.on("price_update", (data: { symbol: string; price: number }) => {
      if (data.symbol === symbol) {
        setCurrentPrice(data.price);
      }
    });

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
      setIsLoading(false);
    });

    return () => {
      if (socket) {
        socket.emit("unsubscribe", { symbol, timeframe });
        socket.disconnect();
      }
    };
  }, [url, symbol, timeframe, autoConnect]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      setIsConnected(false);
    }
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);

  return {
    candles,
    currentPrice,
    isConnected,
    isLoading,
    disconnect,
    reconnect,
    socket: socketRef.current,
  };
};
