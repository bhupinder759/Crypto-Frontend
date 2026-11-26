import { describe, expect, it } from "vitest";
import {
  buildBookSide,
  estimateFillByBase,
  estimateFillByQuote,
  floorToIncrement,
  groupingOptions,
  spreadInfo,
} from "./orderbook";

const bids: [string, string][] = [
  ["100.04", "1"],
  ["100.01", "2"],
  ["99.97", "3"],
];
const asks: [string, string][] = [
  ["100.06", "1"],
  ["100.09", "2"],
  ["100.12", "4"],
];

describe("groupingOptions", () => {
  it("derives steps from the instrument tick", () => {
    expect(groupingOptions("0.01")).toEqual(["0.01", "0.1", "1", "10"]);
    expect(groupingOptions(undefined)).toEqual(["0.01", "0.1", "1", "10"]);
  });
});

describe("buildBookSide", () => {
  it("keeps raw levels at tick grouping with cumulative totals", () => {
    const side = buildBookSide(bids, "bid", "0.01", 10);
    expect(side.map((l) => [l.price, l.size, l.total])).toEqual([
      ["100.04", 1, 1],
      ["100.01", 2, 3],
      ["99.97", 3, 6],
    ]);
  });

  it("floors bids and ceils asks into buckets", () => {
    expect(buildBookSide(bids, "bid", "0.1", 10).map((l) => [l.price, l.size])).toEqual([
      ["100.0", 3],
      ["99.9", 3],
    ]);
    expect(buildBookSide(asks, "ask", "0.1", 10).map((l) => [l.price, l.size])).toEqual([
      ["100.1", 3],
      ["100.2", 4],
    ]);
  });

  it("sorts, limits depth and skips empty/invalid levels", () => {
    const side = buildBookSide([["1", "0"], ["x", "1"], ...asks], "ask", "0.01", 2);
    expect(side.map((l) => l.price)).toEqual(["100.06", "100.09"]);
  });
});

describe("spreadInfo", () => {
  it("computes spread, mid and percent", () => {
    const info = spreadInfo(100, 101)!;
    expect(info.spread).toBe(1);
    expect(info.mid).toBe(100.5);
    expect(info.spreadPct).toBeCloseTo(0.995, 2);
    expect(spreadInfo(undefined, 1)).toBeNull();
  });
});

describe("market fill estimates", () => {
  it("walks levels by base quantity", () => {
    const est = estimateFillByBase(asks, 2);
    expect(est.quoteCost).toBeCloseTo(100.06 + 100.09);
    expect(est.avgPrice).toBeCloseTo(100.075);
    expect(est.insufficientLiquidity).toBe(false);
    expect(estimateFillByBase(asks, 100).insufficientLiquidity).toBe(true);
  });

  it("walks asks by quote budget", () => {
    const est = estimateFillByQuote(asks, 100.06 + 50.045);
    expect(est.baseQty).toBeCloseTo(1.5, 6);
    expect(est.insufficientLiquidity).toBe(false);
    expect(estimateFillByQuote(asks, 1e9).insufficientLiquidity).toBe(true);
  });
});

describe("floorToIncrement", () => {
  it("floors to the step and returns fixed strings", () => {
    expect(floorToIncrement(1.23456, "0.001")).toBe("1.234");
    expect(floorToIncrement(0.3, "0.1")).toBe("0.3");
    expect(floorToIncrement(0.00009, "0.0001")).toBe("");
    expect(floorToIncrement(-1, "0.1")).toBe("");
  });
});
