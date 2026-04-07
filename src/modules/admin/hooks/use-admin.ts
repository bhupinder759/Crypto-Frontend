"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  approveWithdrawal,
  getAdminOverview,
  getPendingWithdrawals,
  getRecentAdminUsers,
  rejectWithdrawal,
} from "@/modules/admin/services/admin.api";

export function useAdminOverviewQuery() {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: getAdminOverview,
    refetchInterval: 15_000,
  });
}

export function useAdminRecentUsersQuery(limit = 12) {
  return useQuery({
    queryKey: ["admin", "users", "recent", limit],
    queryFn: () => getRecentAdminUsers(limit),
    refetchInterval: 30_000,
  });
}

export function useAdminPendingWithdrawalsQuery(limit = 20) {
  return useQuery({
    queryKey: ["admin", "withdrawals", "pending", limit],
    queryFn: () => getPendingWithdrawals(limit),
    refetchInterval: 10_000,
  });
}

export function useApproveWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Withdrawal approved");
    },
  });
}

export function useRejectWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectWithdrawal(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Withdrawal rejected");
    },
  });
}
