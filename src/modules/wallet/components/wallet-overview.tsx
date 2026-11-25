"use client";

import { PageHeader } from "@/components/common/page-header";
import { DemoFaucetCard } from "@/modules/wallet/components/demo-faucet-card";
import { DepositForm } from "@/modules/wallet/components/deposit-form";
import { WalletBalanceList } from "@/modules/wallet/components/wallet-balance-list";
import { WalletHistory } from "@/modules/wallet/components/wallet-history";
import { WithdrawForm } from "@/modules/wallet/components/withdraw-form";
import {
  useDepositsQuery,
  usePortfolioQuery,
  useWithdrawalsQuery,
} from "@/modules/wallet/hooks/use-wallet";

export function WalletOverview({
  accountId,
  mode,
}: {
  accountId?: string;
  mode: "DEMO" | "REAL";
}) {
  const portfolioQuery = usePortfolioQuery(accountId);
  const depositsQuery = useDepositsQuery(mode === "REAL");
  const withdrawalsQuery = useWithdrawalsQuery(mode === "REAL");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Custody"
        title="Wallet"
        description={
          mode === "DEMO"
            ? "Demo balances. Top up virtual funds anytime."
            : "Balances, deposits and withdrawals."
        }
      />
      <WalletBalanceList balances={portfolioQuery.data ?? []} />
      <div className="grid gap-6 xl:grid-cols-2">
        {mode === "DEMO" ? (
          <DemoFaucetCard />
        ) : (
          <>
            <DepositForm />
            <WithdrawForm />
          </>
        )}
      </div>
      {mode === "REAL" ? (
        <WalletHistory
          deposits={depositsQuery.data ?? []}
          withdrawals={withdrawalsQuery.data ?? []}
        />
      ) : null}
    </div>
  );
}
