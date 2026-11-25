"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

export type MarketSocketStatus = "connecting" | "connected" | "reconnecting" | "offline";

let socketStatus: MarketSocketStatus = "connecting";
const statusListeners = new Set<() => void>();
let statusWired = false;

function setSocketStatus(next: MarketSocketStatus) {
  if (socketStatus === next) return;
  socketStatus = next;
  statusListeners.forEach((listener) => listener());
}

function wireSocketStatus(socket: MarketSocket) {
  if (statusWired) return;
  statusWired = true;
  if (socket.connected) socketStatus = "connected";
  socket.on("connect", () => setSocketStatus("connected"));
  socket.on("disconnect", () => setSocketStatus("reconnecting"));
  socket.on("connect_error", () =>
    setSocketStatus(socket.active ? "reconnecting" : "offline"),
  );
  socket.io.on("reconnect_attempt", () => setSocketStatus("reconnecting"));
  socket.io.on("reconnect_failed", () => setSocketStatus("offline"));
  if (typeof window !== "undefined") {
    window.addEventListener("offline", () => setSocketStatus("offline"));
    window.addEventListener("online", () => {
      if (!socket.connected) {
        setSocketStatus("reconnecting");
        socket.connect();
      }
    });
  }
}

function subscribeSocketStatus(listener: () => void) {
  wireSocketStatus(getSharedSocket());
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

/** Live connection state of the shared `/market-data` socket. */
export function useMarketSocketStatus(): MarketSocketStatus {
  return useSyncExternalStore(
    subscribeSocketStatus,
    () => socketStatus,
    () => "connecting",
  );
}

/** Reconnects the shared market socket on demand (e.g. from the status pill). */
export function reconnectMarketSocket() {
  const socket = getSharedSocket();
  if (!socket.connected) {
    setSocketStatus("reconnecting");
    socket.connect();
  }
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
