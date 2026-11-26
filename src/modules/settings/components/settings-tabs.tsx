"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertsCard } from "@/modules/alerts/alerts-card";
import { ApiKeysCard } from "./api-keys-card";
import { SessionsCard } from "./sessions-card";

type Profile = {
  email: string;
  role: string;
  accountId: string | null;
  mode: string;
  kyc: string | null;
};

function ProfileCard({ profile }: { profile: Profile }) {
  const rows: [string, string][] = [
    ["Email", profile.email],
    ["Role", profile.role],
    ["Trading mode", profile.mode],
    ["Account ID", profile.accountId ?? "Not created"],
    ["KYC", profile.kyc ?? "—"],
  ];
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-3 py-2.5">
        <h2 className="text-sm font-medium">Profile</h2>
      </header>
      <dl className="divide-y divide-border/60 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[140px_1fr] gap-3 px-3 py-2">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-mono break-all">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function SettingsTabs({ profile }: { profile: Profile }) {
  return (
    <Tabs defaultValue="security" className="gap-3">
      <TabsList variant="line" className="h-9 border-b border-border">
        <TabsTrigger value="profile" className="text-xs">
          Profile
        </TabsTrigger>
        <TabsTrigger value="security" className="text-xs">
          Security
        </TabsTrigger>
        <TabsTrigger value="alerts" className="text-xs">
          Price alerts
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <ProfileCard profile={profile} />
      </TabsContent>
      <TabsContent value="security" className="space-y-3">
        <SessionsCard />
        <ApiKeysCard />
      </TabsContent>
      <TabsContent value="alerts">
        <AlertsCard />
      </TabsContent>
    </Tabs>
  );
}
