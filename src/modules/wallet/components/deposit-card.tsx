"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateDepositMutation } from "@/modules/wallet/hooks/use-wallet";
import {
  REQUIRED_CONFIRMATIONS,
  demoDepositAddress,
} from "@/modules/wallet/utils/withdrawal";

export function DepositCard({ accountId }: { accountId: string }) {
  const address = demoDepositAddress(accountId);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const mutation = useCreateDepositMutation();
  const amountValid =
    /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(amount) && Number(amount) > 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (insecure context); the address stays selectable.
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <h2 className="text-sm font-medium">Deposit USD</h2>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <div className="self-center rounded-md bg-white p-2 sm:self-start">
          <QRCodeSVG
            value={address}
            size={112}
            level="M"
            aria-label="Deposit address QR code"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-[11px] text-warning">
            <Info className="size-3 shrink-0" />
            Demo address — simulated deposits only. Never send real funds.
          </div>
          <Label className="text-[11px] text-muted-foreground">Address</Label>
          <div className="flex items-center gap-1">
            <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-muted/40 px-2 py-1.5 font-mono text-[11px] select-all">
              {address}
            </code>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={copy}
              aria-label="Copy address"
            >
              {copied ? <Check className="text-buy" /> : <Copy />}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Credited after {REQUIRED_CONFIRMATIONS} confirmations.
          </p>
        </div>
      </div>
      <form
        className="mt-3 flex items-end gap-2 border-t border-border pt-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!amountValid) return;
          mutation.mutate(
            { amount, address, txHash: `sim-${crypto.randomUUID()}` },
            { onSuccess: () => setAmount("") },
          );
        }}
      >
        <div className="flex-1 space-y-1">
          <Label
            htmlFor="sim-deposit"
            className="text-[11px] text-muted-foreground"
          >
            Simulate incoming deposit (USD)
          </Label>
          <Input
            id="sim-deposit"
            inputMode="decimal"
            placeholder="1000.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="h-8 text-xs tabular"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          className="h-8"
          disabled={!amountValid || mutation.isPending}
        >
          {mutation.isPending ? "Sending…" : "Simulate"}
        </Button>
      </form>
    </section>
  );
}
