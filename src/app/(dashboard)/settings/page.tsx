import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { requireServerSession } from "@/lib/api/server-session";
import { SettingsTabs } from "@/modules/settings/components/settings-tabs";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await requireServerSession();

  return (
    <div className="space-y-3">
      <PageHeader title="Settings" description="Profile, security and alerts." />
      <SettingsTabs
        profile={{
          email: session.user.email,
          role: session.user.role,
          accountId: session.account?.id ?? null,
          mode: session.tradingMode,
          kyc: session.account?.kyc ?? null,
        }}
      />
    </div>
  );
}
