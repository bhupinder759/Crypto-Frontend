import { describe, expect, it } from "vitest";
import { WITHDRAW_NETWORKS, demoDepositAddress, validateWithdrawal } from "./withdrawal";

const [internal, erc20] = WITHDRAW_NETWORKS as [(typeof WITHDRAW_NETWORKS)[0], (typeof WITHDRAW_NETWORKS)[0]];

describe("validateWithdrawal", () => {
  it("passes a valid request", () => {
    expect(
      validateWithdrawal({ amount: "100", address: "0x" + "a".repeat(40), available: 500, network: erc20 }),
    ).toEqual({});
  });

  it("checks amount format, minimum and balance including fee", () => {
    const base = { address: "nx-abcdef12", network: internal };
    expect(validateWithdrawal({ ...base, amount: "", available: 10 }).amount).toBe("Enter an amount");
    expect(validateWithdrawal({ ...base, amount: "1.234", available: 10 }).amount).toBe("Use up to 2 decimals");
    expect(validateWithdrawal({ ...base, amount: "5", available: 10 }).amount).toBe("Minimum 10 USD");
    expect(
      validateWithdrawal({ amount: "100", address: "0x" + "b".repeat(40), available: 101, network: erc20 }).amount,
    ).toBe("Amount plus fee exceeds available balance");
  });

  it("validates the address per network", () => {
    expect(validateWithdrawal({ amount: "50", address: "0x123", available: 100, network: erc20 }).address).toMatch(
      /Invalid address/,
    );
    expect(validateWithdrawal({ amount: "50", address: " ", available: 100, network: internal }).address).toBe(
      "Enter a destination address",
    );
  });
});

describe("demoDepositAddress", () => {
  it("is deterministic and clearly a demo address", () => {
    const a = demoDepositAddress("acc_123");
    expect(a).toBe(demoDepositAddress("acc_123"));
    expect(a).not.toBe(demoDepositAddress("acc_456"));
    expect(a.startsWith("nx-demo-")).toBe(true);
  });
});
