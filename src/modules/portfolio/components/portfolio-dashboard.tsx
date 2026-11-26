"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowDownToLine, CandlestickChart, Gift, Wallet } from "lucide-react";
import { QueryErrorCard } from "@/components/common/query-error-card";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/constants/routes";
import { formatCurrency } from "@/lib/utils/formatter";
import type { SessionPayload } from "@/modules/auth/types";
import { usePortfolioOverview } from "@/modules/portfolio/hooks/use-portfolio";
import { useDemoFaucetMutation } from "@/modules/trading/hooks/use-trading-mode";
import { AllocationCard } from "./allocation-card";
import { EquityCard } from "./equity-card";
import { HoldingsTable } from "./holdings-table";
import { RecentFillsCard } from "./recent-fills-card";
import { RecentOrdersCard } from "./recent-orders-card";
import { WatchlistCard } from "./watchlist-card";

function FundAccountCta({ mode }: { mode: "DEMO" | "REAL" }) {
  const faucet = useDemoFaucetMutation();
  return (
    <section className="flex flex-col items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center">
      <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary">
        {mode === "DEMO" ? (
          <Gift className="size-4" />
        ) : (
          <ArrowDownToLine className="size-4" />
        )}
      </div>
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-medium">
          {mode === "DEMO" ? "Start with virtual funds" : "Fund your account"}
        </p>
        <p className="text-xs text-muted-foreground">
          {mode === "DEMO"
            ? "Add 10,000 USD of demo balance and place your first trade risk-free."
            : "Deposit funds to start trading spot markets."}
        </p>
      </div>
      {mode === "DEMO" ? (
        <Button
          disabled={faucet.isPending}
          onClick={() =>
            faucet.mutate({ amount: "10000", operation: "ADD", asset: "USD" })
          }
        >
          {faucet.isPending ? "Adding…" : "Get 10,000 USD"}
        </Button>
      ) : (
        <Button asChild>
          <Link href={routes.wallet as Route}>Deposit</Link>
        </Button>
      )}
    </section>
  );
}

function QuickTrade({
  symbols,
  mode,
}: {
  symbols: string[];
  mode: "DEMO" | "REAL";
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <h2 className="text-xs font-medium">Quick actions</h2>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {symbols.slice(0, 2).map((symbol) => (
          <Button
            key={symbol}
            asChild
            variant="outline"
            size="sm"
            className="justify-start"
          >
            <Link href={`${routes.trading}/${symbol}` as Route}>
              <CandlestickChart className="text-buy" />
              Trade {symbol.split("-")[0]}
            </Link>
          </Button>
        ))}
        <Button asChild variant="outline" size="sm" className="justify-start">
          <Link href={routes.wallet as Route}>
            <Wallet />
            {mode === "DEMO" ? "Demo funds" : "Deposit"}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="justify-start">
          <Link href={routes.markets as Route}>
            <CandlestickChart />
            All markets
          </Link>
        </Button>
      </div>
    </section>
  );
}

export function PortfolioDashboard({ session }: { session: SessionPayload }) {
  const account = session.account;
  const mode = session.tradingMode;
  const { holdings, totals, markets, balancesQuery, isLoading } =
    usePortfolioOverview(account?.id);
  const isEmpty = !isLoading && !balancesQuery.isError && holdings.length === 0;
  const topSymbols = markets.summaries
    .slice()
    .sort((a, b) => (b.quoteVolume24h ?? 0) - (a.quoteVolume24h ?? 0))
    .map((m) => m.symbol);

  if (!account) {
    return (
      <section className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm font-medium">No trading account yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Switch to Demo mode in the header to get a demo account with virtual
          funds.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {balancesQuery.isError ? (
        <QueryErrorCard
          title="Couldn't load balances"
          error={balancesQuery.error}
          onRetry={balancesQuery.refetch}
          retrying={balancesQuery.isFetching}
        />
      ) : null}
      {isEmpty ? <FundAccountCta mode={mode} /> : null}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-3">
          <EquityCard
            holdings={holdings}
            totals={totals}
            loading={isLoading}
            modeLabel={mode === "DEMO" ? "Demo" : "Real"}
          />
          <HoldingsTable holdings={holdings} loading={isLoading} />
          {totals.unpricedAssets.length > 0 ? (
            <p className="text-[11px] text-muted-foreground">
              No USD price for {totals.unpricedAssets.join(", ")}; excluded from
              equity.
            </p>
          ) : null}
          {mode === "REAL" ? <RecentFillsCard accountId={account.id} /> : null}
          <RecentOrdersCard accountId={account.id} />
        </div>
        <div className="space-y-3">
          <AllocationCard holdings={holdings} loading={isLoading} />
          <QuickTrade symbols={topSymbols} mode={mode} />
          <WatchlistCard
            markets={markets.summaries}
            loading={markets.isLoading}
          />
          {!isLoading && totals.cashUsd > 0 ? (
            <p className="px-1 text-[11px] text-muted-foreground">
              Cash {formatCurrency(totals.cashUsd)} available to trade.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
