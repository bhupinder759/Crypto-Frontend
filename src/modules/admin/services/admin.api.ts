"use client";

import { apiGet, apiPost } from "@/lib/api/api-client";
import type {
  AdminOverviewDto,
  AdminPendingWithdrawalDto,
  AdminUserDto,
} from "@/modules/admin/types";

export function getAdminOverview() {
  return apiGet<AdminOverviewDto>("/admin/overview");
}

export function getRecentAdminUsers(limit = 12) {
  return apiGet<AdminUserDto[]>("/admin/users/recent", { limit });
}

export function getPendingWithdrawals(limit = 20) {
  return apiGet<AdminPendingWithdrawalDto[]>(
    "/admin/wallet/withdrawals/pending",
    { limit },
  );
}

export function approveWithdrawal(id: string) {
  return apiPost<AdminPendingWithdrawalDto>(`/admin/wallet/withdrawals/${id}/approve`);
}

export function rejectWithdrawal(id: string, reason: string) {
  return apiPost<AdminPendingWithdrawalDto, { reason: string }>(
    `/admin/wallet/withdrawals/${id}/reject`,
    { reason },
  );
}
