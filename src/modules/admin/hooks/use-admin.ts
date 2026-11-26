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
    refetchInterval: 30_000,
  });
}

export function useAdminUsersQuery(limit = 500) {
  return useQuery({
    queryKey: ["admin", "users", "all", limit],
    queryFn: () => getRecentAdminUsers(limit),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useAdminPendingWithdrawalsQuery(limit = 20) {
  return useQuery({
    queryKey: ["admin", "withdrawals", "pending", limit],
    queryFn: () => getPendingWithdrawals(limit),
    refetchInterval: 20_000,
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
    onError: (error) => toast.error(error.message || "Approve failed"),
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
    onError: (error) => toast.error(error.message || "Reject failed"),
  });
}
