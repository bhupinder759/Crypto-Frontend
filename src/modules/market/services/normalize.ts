/**
 * Response-shape adapters. The backend is moving money to decimal strings and
 * may change shapes; keep all coercion here so components stay untouched.
 */
import type { OrderBookDto, TradeDto } from "@/types/api.types";

type RawLevel =
  | [string | number, string | number]
  | { price: string | number; quantity?: string | number; size?: string | number };

function toDecimalString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value && typeof value === "object" && "toString" in value) {
    return String(value);
  }
  return "0";
}

function normalizeLevels(levels: unknown): [string, string][] {
  if (!Array.isArray(levels)) return [];
  const result: [string, string][] = [];
  for (const level of levels as RawLevel[]) {
    if (Array.isArray(level)) {
      result.push([toDecimalString(level[0]), toDecimalString(level[1])]);
    } else if (level && typeof level === "object") {
      result.push([
        toDecimalString(level.price),
        toDecimalString(level.quantity ?? level.size),
      ]);
    }
  }
  return result;
}

export function normalizeOrderBook(raw: unknown): OrderBookDto | null {
  if (!raw || typeof raw !== "object") return null;
  const book = raw as Record<string, unknown>;
  return {
    symbol: String(book.symbol ?? ""),
    bids: normalizeLevels(book.bids),
    asks: normalizeLevels(book.asks),
    timestamp: Number(book.timestamp ?? Date.now()),
  };
}

export function normalizeTrade(raw: unknown): TradeDto | null {
  if (!raw || typeof raw !== "object") return null;
  const trade = raw as Record<string, unknown>;
  const timestamp = trade.timestamp ?? trade.time ?? trade.createdAt ?? Date.now();
  const side = String(trade.side ?? trade.takerSide ?? "").toUpperCase();
  const buyOrderId = String(trade.buyOrderId ?? "");
  const sellOrderId = String(trade.sellOrderId ?? "");
  return {
    id: String(
      trade.id ?? trade.tradeId ?? `${buyOrderId}-${sellOrderId}-${String(timestamp)}`,
    ),
    symbol: String(trade.symbol ?? ""),
    price: toDecimalString(trade.price),
    quantity: toDecimalString(trade.quantity ?? trade.size),
    buyOrderId,
    sellOrderId,
    timestamp: String(timestamp),
    side: side === "BUY" || side === "SELL" ? side : undefined,
  };
}

export function normalizeTrades(raw: unknown): TradeDto[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeTrade).filter((t): t is TradeDto => t !== null);
}
