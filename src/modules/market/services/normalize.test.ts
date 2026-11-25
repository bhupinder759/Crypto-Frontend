import { describe, expect, it } from "vitest";
import {
  normalizeOrderBook,
  normalizeTicker,
  normalizeTrade,
  normalizeTrades,
} from "./normalize";

describe("normalizeOrderBook", () => {
  it("accepts tuple levels with numbers or strings", () => {
    const book = normalizeOrderBook({
      symbol: "BTC-USD",
      bids: [[65000, 1.5], ["64999.5", "0.2"]],
      asks: [["65001", "0.3"]],
      timestamp: 1,
    });
    expect(book).toEqual({
      symbol: "BTC-USD",
      bids: [["65000", "1.5"], ["64999.5", "0.2"]],
      asks: [["65001", "0.3"]],
      timestamp: 1,
    });
  });

  it("accepts object levels (price/quantity or size)", () => {
    const book = normalizeOrderBook({
      symbol: "ETH-USD",
      bids: [{ price: "3000", quantity: "2" }],
      asks: [{ price: 3001, size: 1 }],
    });
    expect(book?.bids).toEqual([["3000", "2"]]);
    expect(book?.asks).toEqual([["3001", "1"]]);
  });

  it("returns null for non-objects and empty arrays for bad sides", () => {
    expect(normalizeOrderBook(null)).toBeNull();
    expect(normalizeOrderBook("x")).toBeNull();
    expect(normalizeOrderBook({ bids: "nope" })?.bids).toEqual([]);
  });
});

describe("normalizeTrade", () => {
  it("maps tradeId/side/time aliases", () => {
    expect(
      normalizeTrade({ tradeId: "t1", symbol: "BTC-USD", price: 1, quantity: "2", side: "sell", time: 5 }),
    ).toMatchObject({ id: "t1", price: "1", quantity: "2", side: "SELL", timestamp: "5" });
  });

  it("builds a stable id when none is provided and drops unknown sides", () => {
    const trade = normalizeTrade({ buyOrderId: "b", sellOrderId: "s", timestamp: 9, side: "?" });
    expect(trade?.id).toBe("b-s-9");
    expect(trade?.side).toBeUndefined();
  });

  it("filters invalid entries in lists", () => {
    expect(normalizeTrades([null, { id: "a", price: "1", quantity: "1" }])).toHaveLength(1);
    expect(normalizeTrades({})).toEqual([]);
  });
});

describe("normalizeTicker", () => {
  it("fills defaults and aliases", () => {
    expect(normalizeTicker({ last: 10, high: 12, low: 9 }, "SOL-USD")).toEqual({
      symbol: "SOL-USD",
      lastPrice: "10",
      high24h: "12",
      low24h: "9",
      volume24h: "0",
      priceChange24h: "0",
    });
  });

  it("returns null without a price", () => {
    expect(normalizeTicker({}, "X-USD")).toBeNull();
    expect(normalizeTicker(null, "X-USD")).toBeNull();
  });
});
