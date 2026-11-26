"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, TriangleAlert } from "lucide-react";
import { QueryErrorCard } from "@/components/common/query-error-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { formatTimestamp } from "@/lib/utils/formatter";
import {
  API_KEY_PERMISSIONS,
  useApiKeysQuery,
  useCreateApiKey,
  useRevokeApiKey,
  type CreatedApiKeyDto,
} from "@/modules/settings/security";

const PERMISSION_LABELS: Record<string, string> = {
  read: "Read balances, orders and fills",
  trade: "Place and cancel orders",
  "wallet:withdraw": "Request withdrawals",
};

const IP_RE = /^(\d{1,3}(\.\d{1,3}){3}|[0-9a-f:]+)$/i;

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <code className="min-w-0 flex-1 rounded-md border border-border bg-muted/40 px-2 py-1.5 font-mono text-[11px] break-all select-all">
          {value}
        </code>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={`Copy ${label}`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            } catch {
              // clipboard blocked; value stays selectable
            }
          }}
        >
          {copied ? <Check className="text-buy" /> : <Copy />}
        </Button>
      </div>
    </div>
  );
}

export function ApiKeysCard() {
  const query = useApiKeysQuery();
  const create = useCreateApiKey();
  const revoke = useRevokeApiKey();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [permissions, setPermissions] = useState<string[]>(["read"]);
  const [ips, setIps] = useState("");
  const [created, setCreated] = useState<CreatedApiKeyDto | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const keys = query.data ?? [];
  const activeKeys = keys.filter((k) => !k.revokedAt);
  const revokedCount = keys.length - activeKeys.length;
  const ipList = ips.split(/[\s,]+/).filter(Boolean);
  const ipError = ipList.find((ip) => !IP_RE.test(ip));
  const withdrawWithoutIps =
    permissions.includes("wallet:withdraw") && ipList.length === 0;

  const reset = () => {
    setLabel("");
    setPermissions(["read"]);
    setIps("");
  };

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div>
          <h2 className="text-sm font-medium">API keys</h2>
          <p className="text-[11px] text-muted-foreground">
            HMAC-signed keys for bots and scripts.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <KeyRound /> Create key
        </Button>
      </header>
      {query.isError ? (
        <QueryErrorCard
          compact
          className="m-3"
          title="Couldn't load API keys"
          error={query.error}
          onRetry={query.refetch}
        />
      ) : query.isLoading ? (
        <div className="space-y-2 p-3">
          <Skeleton className="h-10 w-full" />
        </div>
      ) : activeKeys.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No active API keys{revokedCount ? ` (${revokedCount} revoked)` : ""}.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {activeKeys.map((key) => (
            <li
              key={key.id}
              className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {key.label || "Untitled key"}{" "}
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {key.keyId}
                  </span>
                </p>
                <p className="mt-0.5 flex flex-wrap gap-1">
                  {key.permissions.map((p) => (
                    <Badge
                      key={p}
                      variant={p.startsWith("wallet") ? "warning" : "muted"}
                    >
                      {p}
                    </Badge>
                  ))}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Created {formatTimestamp(key.createdAt)}
                  {key.ipWhitelist.length
                    ? ` · IPs ${key.ipWhitelist.join(", ")}`
                    : " · any IP"}
                </p>
              </div>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setConfirmRevoke(key.id)}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>
              Grant only what the integration needs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="key-label" className="text-xs">
                Label
              </Label>
              <Input
                id="key-label"
                value={label}
                maxLength={64}
                placeholder="e.g. Grid bot"
                onChange={(e) => setLabel(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Permissions</Label>
              {API_KEY_PERMISSIONS.map((p) => (
                <label
                  key={p}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span>
                    <span className="font-mono">{p}</span>
                    <span className="ml-2 text-muted-foreground">
                      {PERMISSION_LABELS[p]}
                    </span>
                  </span>
                  <Switch
                    size="sm"
                    checked={permissions.includes(p)}
                    onCheckedChange={(checked) =>
                      setPermissions((cur) =>
                        checked ? [...cur, p] : cur.filter((x) => x !== p),
                      )
                    }
                  />
                </label>
              ))}
            </div>
            <div className="space-y-1">
              <Label htmlFor="key-ips" className="text-xs">
                IP whitelist (optional)
              </Label>
              <Input
                id="key-ips"
                value={ips}
                placeholder="203.0.113.7, 198.51.100.0"
                onChange={(e) => setIps(e.target.value)}
                className="h-8 font-mono text-xs"
              />
              {ipError ? (
                <p className="text-[11px] text-destructive">
                  Invalid IP: {ipError}
                </p>
              ) : null}
              {withdrawWithoutIps ? (
                <p className="text-[11px] text-warning">
                  Withdrawal keys should be restricted to known IPs.
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                permissions.length === 0 || Boolean(ipError) || create.isPending
              }
              onClick={() =>
                create.mutate(
                  {
                    permissions,
                    ...(label ? { label } : {}),
                    ...(ipList.length ? { ipWhitelist: ipList } : {}),
                  },
                  {
                    onSuccess: (key) => {
                      setOpen(false);
                      reset();
                      setCreated(key);
                    },
                  },
                )
              }
            >
              {create.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={created != null}
        onOpenChange={(value) => !value && setCreated(null)}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Save your secret now</DialogTitle>
            <DialogDescription>
              This is the only time the secret is shown. Store it in a password
              manager.
            </DialogDescription>
          </DialogHeader>
          {created ? (
            <div className="space-y-3">
              <CopyField label="Key ID" value={created.keyId} />
              <CopyField label="Secret" value={created.secret} />
              <p className="flex items-center gap-1.5 text-[11px] text-warning">
                <TriangleAlert className="size-3.5" /> Lost secrets can&apos;t
                be recovered — revoke and create a new key.
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={() => setCreated(null)}>I&apos;ve saved it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmRevoke != null}
        onOpenChange={(value) => !value && setConfirmRevoke(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke API key?</DialogTitle>
            <DialogDescription>
              Integrations using it stop working immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRevoke(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={revoke.isPending}
              onClick={() => {
                if (confirmRevoke)
                  revoke.mutate(confirmRevoke, {
                    onSettled: () => setConfirmRevoke(null),
                  });
              }}
            >
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
