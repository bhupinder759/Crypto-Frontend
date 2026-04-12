import { requireServerSession } from "@/lib/api/server-session";
import { WalletOverview } from "@/modules/wallet/components/wallet-overview";

export default async function WalletPage() {
  const session = await requireServerSession();
  return (
    <WalletOverview
      accountId={session.account?.id}
      mode={session.tradingMode}
    />
  );
}
