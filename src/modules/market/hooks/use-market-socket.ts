"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { env } from "@/config/env";
import type { MarketData } from "@/modules/market/types/market-data";
import type { OrderBookDto } from "@/types/api.types";

type ServerToClientEvents = {
  live_candle: (payload: MarketData) => void;
  live_orderbook: (payload: OrderBookDto) => void;
  market_connected: (payload: { clientId: string }) => void;
  market_subscription_status: (payload: {
    room: string;
    status: "subscribed" | "unsubscribed";
  }) => void;
};

type ClientToServerEvents = {
  subscribe_market: (payload: { symbol: string; interval: string }) => void;
  unsubscribe_market: (payload: { symbol: string; interval: string }) => void;
};

type MarketSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let sharedSocket: MarketSocket | null = null;
const subscriptionCounts = new Map<string, number>();

function getSubscriptionKey(symbol: string, interval: string) {
  return `${symbol}:${interval}`;
}

function getSharedSocket(): MarketSocket {
  if (!sharedSocket) {
    sharedSocket = io(`${env.backendHttpUrl}/market-data`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
    });
  }

  return sharedSocket;
}

export function useMarketSocket(symbol: string, interval: string) {
  const socketRef = useRef<MarketSocket | null>(null);
  const [isConnected, setIsConnected] = useState(
    () => getSharedSocket().connected,
  );

  useEffect(() => {
    if (!symbol || !interval) {
      return;
    }

    const socket = getSharedSocket();
    const subscriptionKey = getSubscriptionKey(symbol, interval);
    const nextCount = (subscriptionCounts.get(subscriptionKey) ?? 0) + 1;

    subscriptionCounts.set(subscriptionKey, nextCount);
    socketRef.current = socket;

    const subscribe = () => {
      socket.emit("subscribe_market", { symbol, interval });
    };

    const handleConnect = () => {
      setIsConnected(true);
      subscribe();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      subscribe();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);

      const remainingCount = (subscriptionCounts.get(subscriptionKey) ?? 1) - 1;

      if (remainingCount <= 0) {
        subscriptionCounts.delete(subscriptionKey);
        socket.emit("unsubscribe_market", { symbol, interval });
      } else {
        subscriptionCounts.set(subscriptionKey, remainingCount);
      }

      socketRef.current = sharedSocket;
    };
  }, [interval, symbol]);

  return {
    socketRef,
    isConnected,
  };
}
