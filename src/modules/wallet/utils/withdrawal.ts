import { dec } from "@/lib/utils/decimal";

/**
 * Withdrawal rules shown in the UI. The backend takes only amount + address
 * (USD ledger), so networks and fees here are display estimates.
 */
export type WithdrawNetwork = {
  id: string;
  label: string;
  fee: number;
  eta: string;
  addressPattern: RegExp;
  addressHint: string;
};

export const WITHDRAW_NETWORKS: WithdrawNetwork[] = [
  {
    id: "internal",
    label: "Nexfin internal",
    fee: 0,
    eta: "Instant after approval",
    addressPattern: /^nx[-_][a-z0-9]{6,64}$/i,
    addressHint: "Starts with nx-",
  },
  {
    id: "erc20",
    label: "Ethereum (ERC-20)",
    fee: 2.5,
    eta: "~5 min after approval",
    addressPattern: /^0x[a-f0-9]{40}$/i,
    addressHint: "0x followed by 40 hex characters",
  },
  {
    id: "trc20",
    label: "Tron (TRC-20)",
    fee: 1,
    eta: "~2 min after approval",
    addressPattern: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
    addressHint: "Starts with T, 34 characters",
  },
];

export const MIN_WITHDRAWAL = 10;

export type WithdrawErrors = { amount?: string; address?: string };

export function validateWithdrawal(input: {
  amount: string;
  address: string;
  available: number | string;
  network: WithdrawNetwork;
}): WithdrawErrors {
  const errors: WithdrawErrors = {};
  const amount = input.amount.trim();

  if (!amount) errors.amount = "Enter an amount";
  else if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(amount))
    errors.amount = "Use up to 2 decimals";
  else if (dec(amount).lt(MIN_WITHDRAWAL))
    errors.amount = `Minimum ${MIN_WITHDRAWAL} USD`;
  else if (dec(amount).plus(input.network.fee).gt(dec(input.available)))
    errors.amount = "Amount plus fee exceeds available balance";

  const address = input.address.trim();
  if (!address) errors.address = "Enter a destination address";
  else if (!input.network.addressPattern.test(address))
    errors.address = `Invalid address — ${input.network.addressHint}`;

  return errors;
}

/** Deterministic demo deposit address for an account (never a real wallet). */
export function demoDepositAddress(accountId: string): string {
  let hash = 2166136261;
  for (const char of accountId) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const part = (hash >>> 0).toString(36).padStart(7, "0");
  const tail = accountId
    .replace(/[^a-z0-9]/gi, "")
    .slice(-8)
    .toLowerCase();
  return `nx-demo-${part}${tail}`;
}

export const REQUIRED_CONFIRMATIONS = 3;
