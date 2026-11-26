import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { MarketsTable } from "@/modules/market/components/markets-table";

export const metadata: Metadata = {
  title: "Markets",
};

export default function MarketsPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Markets" description="Spot pairs, 24h stats and 7-day trend." />
      <MarketsTable />
    </div>
  );
}
