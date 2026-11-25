"use client";

import { QueryErrorCard } from "@/components/common/query-error-card";
import { PageHeader } from "@/components/common/page-header";
import { usePortfolioOverview } from "@/modules/portfolio/hooks/use-portfolio";
import { DemoFaucetCard } from "@/modules/wallet/components/demo-faucet-card";
import { DepositCard } from "./deposit-card";
import { WalletBalances } from "./wallet-balances";
import { WalletHistory } from "./wallet-history";
import { WithdrawCard } from "./withdraw-card";

export function WalletOverview({
  accountId,
  mode,
}: {
  accountId?: string;
  mode: "DEMO" | "REAL";
}) {
  const { holdings, totals, balancesQuery, isLoading } =
    usePortfolioOverview(accountId);
  const usdAvailable = holdings.find((h) => h.asset === "USD")?.available ?? 0;

  return (
    <div className="space-y-3">
      <PageHeader
        title="Wallet"
        description={
          mode === "DEMO"
            ? "Demo balances. Top up virtual funds anytime."
            : "Balances, deposits and withdrawals."
        }
      />
      {balancesQuery.isError ? (
        <QueryErrorCard
          title="Couldn't load balances"
          error={balancesQuery.error}
          onRetry={balancesQuery.refetch}
          retrying={balancesQuery.isFetching}
        />
      ) : (
        <WalletBalances
          holdings={holdings}
          totals={totals}
          loading={isLoading}
        />
      )}
      {mode === "DEMO" ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <DemoFaucetCard />
        </div>
      ) : accountId ? (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            <DepositCard accountId={accountId} />
            <WithdrawCard available={usdAvailable} />
          </div>
          <WalletHistory />
        </>
      ) : null}
    </div>
  );
}
