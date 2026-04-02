"use client";

import { apiGet, apiPost } from "@/lib/api/api-client";
import type {
  DepositDto,
  PortfolioBalanceDto,
  WithdrawalDto,
} from "@/modules/wallet/types";

export function getPortfolio(accountId: string) {
  return apiGet<PortfolioBalanceDto[]>("/balance/portfolio", { accountId });
}

export function getDeposits(limit = 20) {
  return apiGet<DepositDto[]>("/wallet/deposits", { limit });
}

export function getWithdrawals(limit = 20) {
  return apiGet<WithdrawalDto[]>("/wallet/withdrawals", { limit });
}

export function requestWithdrawal(payload: { amount: string; address: string }) {
  return apiPost<{ message: string; withdrawalId: string }, typeof payload>(
    "/wallet/withdraw",
    payload,
  );
}

export function createMockDeposit(payload: {
  amount: string;
  address: string;
  txHash: string;
}) {
  return apiPost<
    {
      message: string;
      depositId: string;
      txHash: string;
      confirmations: number;
      confirmed: boolean;
    },
    typeof payload
  >("/wallet/deposit", payload);
}
