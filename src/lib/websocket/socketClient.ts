"use client";

import { env } from "@/config/env";
import { logger } from "@/lib/utils/logger";

type Listener = (payload: unknown) => void;

export class SocketClient {
  private socket?: WebSocket;
  private listeners = new Map<string, Set<Listener>>();
  private isConnecting = false;
  private subscribedChannels = new Set<string>();

  connect() {
    if (this.socket || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.socket = new WebSocket(env.backendWsUrl);

    this.socket.onopen = () => {
      this.isConnecting = false;
      logger.info("WebSocket connected");
      this.flushSubscriptions();
    };

    this.socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as {
        channel?: string;
        data?: unknown;
      };

      if (!payload.channel) {
        return;
      }

      this.listeners.get(payload.channel)?.forEach((listener) => {
        listener(payload.data);
      });
    };

    this.socket.onclose = () => {
      this.socket = undefined;
      this.isConnecting = false;
      logger.info("WebSocket disconnected");
    };
  }

  subscribe(channel: string, listener: Listener) {
    this.connect();

    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }

    this.listeners.get(channel)?.add(listener);
    this.subscribedChannels.add(channel);

    this.sendWhenOpen("subscribe", channel);

    return () => {
      this.listeners.get(channel)?.delete(listener);

      if ((this.listeners.get(channel)?.size ?? 0) === 0) {
        this.listeners.delete(channel);
        this.subscribedChannels.delete(channel);
        this.sendWhenOpen("unsubscribe", channel);
      }
    };
  }

  private flushSubscriptions() {
    for (const channel of this.subscribedChannels) {
      this.sendWhenOpen("subscribe", channel);
    }
  }

  private sendWhenOpen(action: "subscribe" | "unsubscribe", channel: string) {
    const payload = JSON.stringify({ action, channel });

    if (!this.socket) {
      return;
    }

    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payload);
      return;
    }

    if (this.socket.readyState === WebSocket.CONNECTING) {
      const socket = this.socket;
      const onOpen = () => {
        socket.removeEventListener("open", onOpen);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(payload);
        }
      };
      socket.addEventListener("open", onOpen);
    }
  }
}

export const socketClient = new SocketClient();
