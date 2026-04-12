"use client";

import { create } from "zustand";
import type {
  ChartDrawingConfig,
  ChartIndicatorConfig,
} from "@/modules/market/types/chart-workspace";

type TrendAnchor = {
  time: number;
  price: number;
};

type ChartWorkspaceState = {
  lastViewedTimestamp: number | null;
  indicatorConfig: ChartIndicatorConfig[];
  drawingConfig: ChartDrawingConfig[];
  pendingTrendAnchor: TrendAnchor | null;
  hydrated: boolean;
};

type ChartWorkspaceStore = {
  workspaces: Record<string, ChartWorkspaceState>;
  hydrateWorkspace: (
    key: string,
    payload: {
      lastViewedTimestamp: number | null;
      indicatorConfig: ChartIndicatorConfig[];
      drawingConfig: ChartDrawingConfig[];
    },
  ) => void;
  setLastViewedTimestamp: (key: string, timestamp: number | null) => void;
  toggleSmaIndicator: (key: string, length: number) => void;
  addHorizontalLine: (
    key: string,
    payload: { price: number; color?: string },
  ) => void;
  startTrendLine: (
    key: string,
    payload: { time: number; price: number },
  ) => void;
  completeTrendLine: (
    key: string,
    payload: { time: number; price: number; color?: string },
  ) => void;
  clearPendingTrendLine: (key: string) => void;
};

export const DEFAULT_CHART_WORKSPACE: ChartWorkspaceState = {
  lastViewedTimestamp: null,
  indicatorConfig: [],
  drawingConfig: [],
  pendingTrendAnchor: null,
  hydrated: false,
};

function chartKey(symbol: string, interval: string) {
  return `${symbol}:${interval}`;
}

function ensureWorkspace(
  workspaces: Record<string, ChartWorkspaceState>,
  key: string,
): ChartWorkspaceState {
  return workspaces[key] ?? DEFAULT_CHART_WORKSPACE;
}

export const getChartWorkspaceKey = chartKey;

export const useChartWorkspaceStore = create<ChartWorkspaceStore>((set) => ({
  workspaces: {},
  hydrateWorkspace: (key, payload) =>
    set((state) => {
      const existing = ensureWorkspace(state.workspaces, key);
      if (existing.hydrated) {
        return state;
      }

      return {
        workspaces: {
          ...state.workspaces,
          [key]: {
            ...existing,
            ...payload,
            hydrated: true,
          },
        },
      };
    }),
  setLastViewedTimestamp: (key, timestamp) =>
    set((state) => ({
      workspaces: {
        ...state.workspaces,
        [key]: {
          ...ensureWorkspace(state.workspaces, key),
          lastViewedTimestamp: timestamp,
        },
      },
    })),
  toggleSmaIndicator: (key, length) =>
    set((state) => {
      const workspace = ensureWorkspace(state.workspaces, key);
      const indicatorId = `sma-${length}`;
      const exists = workspace.indicatorConfig.some(
        (indicator) => indicator.id === indicatorId,
      );

      return {
        workspaces: {
          ...state.workspaces,
          [key]: {
            ...workspace,
            indicatorConfig: exists
              ? workspace.indicatorConfig.filter(
                  (indicator) => indicator.id !== indicatorId,
                )
              : [
                  ...workspace.indicatorConfig,
                  {
                    id: indicatorId,
                    type: "sma",
                    length,
                    color: length === 20 ? "#38bdf8" : "#f59e0b",
                  },
                ],
          },
        },
      };
    }),
  addHorizontalLine: (key, payload) =>
    set((state) => {
      const workspace = ensureWorkspace(state.workspaces, key);
      return {
        workspaces: {
          ...state.workspaces,
          [key]: {
            ...workspace,
            drawingConfig: [
              ...workspace.drawingConfig,
              {
                id: `horizontal-${Date.now()}`,
                type: "horizontal",
                price: payload.price,
                color: payload.color ?? "#f97316",
              },
            ],
          },
        },
      };
    }),
  startTrendLine: (key, payload) =>
    set((state) => ({
      workspaces: {
        ...state.workspaces,
        [key]: {
          ...ensureWorkspace(state.workspaces, key),
          pendingTrendAnchor: payload,
        },
      },
    })),
  completeTrendLine: (key, payload) =>
    set((state) => {
      const workspace = ensureWorkspace(state.workspaces, key);
      const anchor = workspace.pendingTrendAnchor;

      if (!anchor) {
        return state;
      }

      return {
        workspaces: {
          ...state.workspaces,
          [key]: {
            ...workspace,
            pendingTrendAnchor: null,
            drawingConfig: [
              ...workspace.drawingConfig,
              {
                id: `trend-${Date.now()}`,
                type: "trend",
                startTime: anchor.time,
                startPrice: anchor.price,
                endTime: payload.time,
                endPrice: payload.price,
                color: payload.color ?? "#a855f7",
              },
            ],
          },
        },
      };
    }),
  clearPendingTrendLine: (key) =>
    set((state) => ({
      workspaces: {
        ...state.workspaces,
        [key]: {
          ...ensureWorkspace(state.workspaces, key),
          pendingTrendAnchor: null,
        },
      },
    })),
}));
