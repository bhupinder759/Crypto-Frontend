import type { Metadata } from "next";
import { requireServerSession } from "@/lib/api/server-session";
import { TradingWorkspace } from "@/modules/trading/components/trading-workspace";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  return {
    title: `${symbol} Trading`,
  };
}

export default async function TradingSymbolPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const session = await requireServerSession();
  return <TradingWorkspace symbol={symbol} account={session.account} />;
}
