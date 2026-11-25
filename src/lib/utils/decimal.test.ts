import { describe, expect, it } from "vitest";
import { bpsToRate, dec, floorToStep, isDecimalString, isStepMultiple } from "./decimal";

describe("decimal helpers", () => {
  it("does exact arithmetic", () => {
    expect(dec("0.1").plus("0.2").toString()).toBe("0.3");
    expect(dec("65000.12").mul("0.00001").toString()).toBe("0.6500012");
    expect(dec("abc").toString()).toBe("0");
  });

  it("floors to step without float drift", () => {
    expect(floorToStep("0.3", "0.1")).toBe("0.3");
    expect(floorToStep("1.23456", "0.001")).toBe("1.234");
    expect(floorToStep("0.00009", "0.0001")).toBe("");
    expect(floorToStep(12.5, "1")).toBe("12");
  });

  it("checks multiples and decimal strings", () => {
    expect(isStepMultiple("0.00003", "0.00001")).toBe(true);
    expect(isStepMultiple("0.000035", "0.00001")).toBe(false);
    expect(isDecimalString("12.34", 2)).toBe(true);
    expect(isDecimalString("1e3")).toBe(false);
    expect(isDecimalString("-1")).toBe(false);
  });

  it("converts bps", () => {
    expect(bpsToRate(20).toString()).toBe("0.002");
  });
});
