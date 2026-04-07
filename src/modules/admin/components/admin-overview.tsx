"use client";

import { MetricCard } from "@/components/common/metric-card";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminOverviewQuery, useAdminPendingWithdrawalsQuery, useAdminRecentUsersQuery, useApproveWithdrawalMutation, useRejectWithdrawalMutation } from "@/modules/admin/hooks/use-admin";
import { formatNumber, formatTimestamp } from "@/lib/utils/formatter";

export function AdminOverview() {
  const overviewQuery = useAdminOverviewQuery();
  const usersQuery = useAdminRecentUsersQuery();
  const withdrawalsQuery = useAdminPendingWithdrawalsQuery();
  const approveMutation = useApproveWithdrawalMutation();
  const rejectMutation = useRejectWithdrawalMutation();
  const overview = overviewQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Control Tower"
        description="Operational visibility for users, balances, order flow, and payout queues."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Users" value={overview ? formatNumber(overview.users, 0) : "--"} />
        <MetricCard title="Admins" value={overview ? formatNumber(overview.admins, 0) : "--"} />
        <MetricCard title="Open Orders" value={overview ? formatNumber(overview.openOrders, 0) : "--"} />
        <MetricCard title="Pending Withdrawals" value={overview ? formatNumber(overview.pendingWithdrawals, 0) : "--"} />
        <MetricCard title="24h Volume" value={overview ? formatNumber(overview.volume24hQuote, 2) : "--"} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pending Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(withdrawalsQuery.data ?? []).map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell className="font-medium">{withdrawal.userId}</TableCell>
                    <TableCell>{withdrawal.amount}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{withdrawal.address}</TableCell>
                    <TableCell>{formatTimestamp(withdrawal.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          onClick={() => approveMutation.mutate(withdrawal.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          onClick={() =>
                            rejectMutation.mutate({
                              id: withdrawal.id,
                              reason: "Rejected by admin operator",
                            })
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(withdrawalsQuery.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No pending withdrawals
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(usersQuery.data ?? []).map((user) => (
              <div
                key={user.id}
                className="rounded-xl border border-border/60 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatTimestamp(user.createdAt)}
                    </p>
                  </div>
                  <Badge variant={user.role === "ADMIN" ? "default" : "info"}>
                    {user.role}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
