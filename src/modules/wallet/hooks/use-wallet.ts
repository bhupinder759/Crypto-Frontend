"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createMockDeposit,
  getDeposits,
  getPortfolio,
  getWithdrawals,
  requestWithdrawal,
} from "@/modules/wallet/services/wallet.api";

export function usePortfolioQuery(accountId?: string) {
  return useQuery({
    queryKey: ["wallet", "portfolio", accountId],
    queryFn: () => getPortfolio(accountId!),
    enabled: Boolean(accountId),
    refetchInterval: 10_000,
  });
}

export function useDepositsQuery() {
  return useQuery({
    queryKey: ["wallet", "deposits"],
    queryFn: () => getDeposits(),
    refetchInterval: 10_000,
  });
}

export function useWithdrawalsQuery() {
  return useQuery({
    queryKey: ["wallet", "withdrawals"],
    queryFn: () => getWithdrawals(),
    refetchInterval: 10_000,
  });
}

export function useRequestWithdrawalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "portfolio"] });
      toast.success("Withdrawal requested");
    },
  });
}

export function useCreateDepositMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMockDeposit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "deposits"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "portfolio"] });
      toast.success("Deposit registered");
    },
  });
}
