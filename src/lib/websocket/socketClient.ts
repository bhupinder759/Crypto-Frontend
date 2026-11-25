"use client";

import { env } from "@/config/env";
import { logger } from "@/lib/utils/logger";

type Listener = (payload: unknown) => void;

const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

/**
 * Minimal raw WebSocket client for the backend `/ws` gateway (order book and
 * trades). Reconnects with exponential backoff + jitter while anyone is
 * subscribed, and re-subscribes all channels after each reconnect.
 */
export class SocketClient {
  private socket?: WebSocket;
  private listeners = new Map<string, Set<Listener>>();
  private reconnectAttempts = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;

  connect() {
    if (typeof window === "undefined" || this.socket) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;

    let socket: WebSocket;
    try {
      socket = new WebSocket(env.backendWsUrl);
    } catch (error) {
      logger.error("WebSocket connect failed", error);
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempts = 0;
      logger.info("WebSocket connected");
      for (const channel of this.listeners.keys()) {
        this.send("subscribe", channel);
      }
    };

    socket.onmessage = (event) => {
      const payload = parseMessage(event.data);
      if (!payload?.channel) {
        return;
      }

      this.listeners.get(payload.channel)?.forEach((listener) => {
        try {
          listener(payload.data);
        } catch (error) {
          logger.error(`WebSocket listener failed (${payload.channel})`, error);
        }
      });
    };

    socket.onerror = () => {
      // onclose always follows; reconnect is handled there.
    };

    socket.onclose = () => {
      if (this.socket === socket) {
        this.socket = undefined;
      }
      logger.info("WebSocket disconnected");
      this.scheduleReconnect();
    };
  }

  subscribe(channel: string, listener: Listener) {
    const isNewChannel = !this.listeners.has(channel);
    if (isNewChannel) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)?.add(listener);

    if (!this.socket) {
      this.connect();
    } else if (isNewChannel) {
      this.send("subscribe", channel);
    }

    return () => {
      const channelListeners = this.listeners.get(channel);
      channelListeners?.delete(listener);

      if (channelListeners && channelListeners.size === 0) {
        this.listeners.delete(channel);
        this.send("unsubscribe", channel);
      }

      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.reconnectAttempts = 0;
    const socket = this.socket;
    this.socket = undefined;
    if (socket) {
      socket.onclose = null;
      socket.close();
    }
  }

  private scheduleReconnect() {
    if (this.listeners.size === 0 || this.reconnectTimer) {
      return;
    }

    const exp = Math.min(
      MAX_RECONNECT_DELAY_MS,
      BASE_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempts,
    );
    const delay = exp / 2 + Math.random() * (exp / 2);
    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, delay);
  }

  /** Sends only when open; pending channels are flushed in `onopen`. */
  private send(action: "subscribe" | "unsubscribe", channel: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action, channel }));
    }
  }
}

function parseMessage(
  raw: unknown,
): { channel?: string; data?: unknown } | null {
  if (typeof raw !== "string") {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as { channel?: string; data?: unknown })
      : null;
  } catch {
    logger.error("WebSocket received malformed JSON");
    return null;
  }
}

export const socketClient = new SocketClient();
