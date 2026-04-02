"use client";

import { PageHeader } from "@/components/common/page-header";
import { DepositForm } from "@/modules/wallet/components/deposit-form";
import { WalletBalanceList } from "@/modules/wallet/components/wallet-balance-list";
import { WalletHistory } from "@/modules/wallet/components/wallet-history";
import { WithdrawForm } from "@/modules/wallet/components/withdraw-form";
import { useDepositsQuery, usePortfolioQuery, useWithdrawalsQuery } from "@/modules/wallet/hooks/use-wallet";

export function WalletOverview({ accountId }: { accountId?: string }) {
  const portfolioQuery = usePortfolioQuery(accountId);
  const depositsQuery = useDepositsQuery();
  const withdrawalsQuery = useWithdrawalsQuery();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Custody"
        title="Wallet Operations"
        description="Review balances, register deposits, and request withdrawals against the backend wallet workflows."
      />
      <WalletBalanceList balances={portfolioQuery.data ?? []} />
      <div className="grid gap-6 xl:grid-cols-2">
        <DepositForm />
        <WithdrawForm />
      </div>
      <WalletHistory
        deposits={depositsQuery.data ?? []}
        withdrawals={withdrawalsQuery.data ?? []}
      />
    </div>
  );
}
