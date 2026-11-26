import { describe, expect, it } from "vitest";
import { validateTicket } from "./ticket-validation";

const rules = {
  minQuantity: "0.0001",
  quantityIncrement: "0.00001",
  priceIncrement: "0.01",
  baseAsset: "BTC",
};

describe("validateTicket", () => {
  it("accepts valid limit orders", () => {
    expect(validateTicket({ quantity: "0.0015", price: "65000.01", type: "LIMIT", rules })).toEqual({
      amountError: null,
      priceError: null,
    });
  });

  it("enforces minimum quantity and step", () => {
    expect(validateTicket({ quantity: "0.00005", price: "", type: "LIMIT", rules }).amountError).toBe(
      "Min 0.0001 BTC",
    );
    expect(validateTicket({ quantity: "0.000155", price: "", type: "MARKET", rules }).amountError).toBe(
      "Step 0.00001 BTC",
    );
    expect(validateTicket({ quantity: "0", price: "", type: "MARKET", rules }).amountError).toBe(
      "Amount too small",
    );
  });

  it("enforces price tick only for limit orders", () => {
    expect(validateTicket({ quantity: "", price: "65000.005", type: "LIMIT", rules }).priceError).toBe(
      "Tick 0.01",
    );
    expect(validateTicket({ quantity: "", price: "0", type: "LIMIT", rules }).priceError).toBe("Enter a price");
    expect(validateTicket({ quantity: "", price: "65000.005", type: "MARKET", rules }).priceError).toBeNull();
  });

  it("skips checks while fields are empty or rules are unknown", () => {
    expect(validateTicket({ quantity: "", price: "", type: "LIMIT", rules })).toEqual({
      amountError: null,
      priceError: null,
    });
    expect(validateTicket({ quantity: "0.000001", price: "1.001", type: "LIMIT", rules: null })).toEqual({
      amountError: null,
      priceError: null,
    });
  });
});
