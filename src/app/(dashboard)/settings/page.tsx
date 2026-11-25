import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireServerSession } from "@/lib/api/server-session";

export default async function SettingsPage() {
  const session = await requireServerSession();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Identity"
        title="Settings"
        description="Profile, account and security preferences."
      />
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <span className="text-muted-foreground">Email</span>
            <span>{session.user.email}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <span className="text-muted-foreground">Role</span>
            <span>{session.user.role}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <span className="text-muted-foreground">Account ID</span>
            <span>{session.account?.id ?? "Not created"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
