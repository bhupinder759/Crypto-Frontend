import { describe, expect, it } from "vitest";
import {
  decimalsFromIncrement,
  decimalsFromPrice,
  formatFixed,
  isMultipleOf,
} from "./precision";

describe("decimalsFromIncrement", () => {
  it.each([
    ["0.01", 2],
    ["0.00001", 5],
    ["1", 0],
    ["10", 0],
    ["0.10", 1],
    ["1e-8", 8],
    ["2.5e-6", 7],
  ])("%s → %d", (inc, expected) => {
    expect(decimalsFromIncrement(inc)).toBe(expected);
  });

  it("falls back for missing or invalid increments", () => {
    expect(decimalsFromIncrement(undefined, 3)).toBe(3);
    expect(decimalsFromIncrement("abc", 4)).toBe(4);
    expect(decimalsFromIncrement("0", 2)).toBe(2);
  });
});

describe("decimalsFromPrice", () => {
  it("scales precision with magnitude", () => {
    expect(decimalsFromPrice(65000)).toBe(2);
    expect(decimalsFromPrice(3.2)).toBe(4);
    expect(decimalsFromPrice(0.05)).toBe(6);
    expect(decimalsFromPrice(0.0001)).toBe(8);
    expect(decimalsFromPrice(null)).toBe(2);
  });
});

describe("isMultipleOf", () => {
  it("is exact for decimals (no float drift)", () => {
    expect(isMultipleOf("0.3", "0.1")).toBe(true);
    expect(isMultipleOf("0.00003", "0.00001")).toBe(true);
    expect(isMultipleOf("65000.12", "0.01")).toBe(true);
    expect(isMultipleOf("65000.125", "0.01")).toBe(false);
    expect(isMultipleOf("5", "2")).toBe(false);
  });

  it("rejects zero, negatives and garbage", () => {
    expect(isMultipleOf("0", "0.01")).toBe(false);
    expect(isMultipleOf("-1", "0.01")).toBe(false);
    expect(isMultipleOf("1e3", "1")).toBe(false);
    expect(isMultipleOf("1", "0")).toBe(false);
  });
});

describe("formatFixed", () => {
  it("formats with fixed decimals and handles empties", () => {
    expect(formatFixed(1234.5, 2)).toBe("1,234.50");
    expect(formatFixed("0.1", 4)).toBe("0.1000");
    expect(formatFixed(null, 2)).toBe("--");
    expect(formatFixed("nope", 2)).toBe("--");
  });
});
