"use client";

import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatter";
import { useRequestWithdrawalMutation } from "@/modules/wallet/hooks/use-wallet";
import {
  MIN_WITHDRAWAL,
  WITHDRAW_NETWORKS,
  validateWithdrawal,
} from "@/modules/wallet/utils/withdrawal";

function Line({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular", strong && "font-semibold")}>{value}</span>
    </div>
  );
}

export function WithdrawCard({ available }: { available: number }) {
  const [networkId, setNetworkId] = useState(WITHDRAW_NETWORKS[0]!.id);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [touched, setTouched] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const mutation = useRequestWithdrawalMutation();
  const network =
    WITHDRAW_NETWORKS.find((n) => n.id === networkId) ?? WITHDRAW_NETWORKS[0]!;

  const errors = useMemo(
    () => validateWithdrawal({ amount, address, available, network }),
    [address, amount, available, network],
  );
  const valid = !errors.amount && !errors.address;
  const total = Number(amount || 0) + network.fee;

  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <h2 className="text-sm font-medium">Withdraw USD</h2>
      <form
        className="mt-3 space-y-2.5"
        onSubmit={(event) => {
          event.preventDefault();
          setTouched(true);
          if (valid) setConfirmOpen(true);
        }}
      >
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Network</Label>
          <Select value={networkId} onValueChange={setNetworkId}>
            <SelectTrigger size="sm" className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WITHDRAW_NETWORKS.map((n) => (
                <SelectItem key={n.id} value={n.id} className="text-xs">
                  {n.label} · fee {formatCurrency(n.fee)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label
            htmlFor="withdraw-address"
            className="text-[11px] text-muted-foreground"
          >
            Destination address
          </Label>
          <Input
            id="withdraw-address"
            value={address}
            autoComplete="off"
            spellCheck={false}
            placeholder={network.addressHint}
            aria-invalid={touched && Boolean(errors.address)}
            onChange={(event) => setAddress(event.target.value)}
            className="h-8 font-mono text-xs"
          />
          {touched && errors.address ? (
            <p className="text-[11px] text-destructive">{errors.address}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="withdraw-amount"
              className="text-[11px] text-muted-foreground"
            >
              Amount (USD)
            </Label>
            <button
              type="button"
              className="text-[11px] text-primary hover:underline"
              onClick={() =>
                setAmount(
                  Math.max(
                    0,
                    Math.floor((available - network.fee) * 100) / 100,
                  ).toFixed(2),
                )
              }
            >
              Max {formatCurrency(Math.max(0, available - network.fee))}
            </button>
          </div>
          <Input
            id="withdraw-amount"
            inputMode="decimal"
            value={amount}
            placeholder={`Min ${MIN_WITHDRAWAL}`}
            aria-invalid={touched && Boolean(errors.amount)}
            onChange={(event) => setAmount(event.target.value)}
            className="h-8 text-xs tabular"
          />
          {touched && errors.amount ? (
            <p className="text-[11px] text-destructive">{errors.amount}</p>
          ) : null}
        </div>
        <div className="space-y-1 rounded-md bg-muted/50 p-2">
          <Line label="Available" value={formatCurrency(available)} />
          <Line
            label="Network fee (est.)"
            value={formatCurrency(network.fee)}
          />
          <Line label="Total debited" value={formatCurrency(total)} strong />
          <Line label="Arrival" value={network.eta} />
        </div>
        <Button
          type="submit"
          className="h-8 w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Submitting…" : "Review withdrawal"}
        </Button>
        <p className="text-[10px] text-muted-foreground">
          Withdrawals are reviewed by an admin before they are sent.
        </p>
      </form>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm withdrawal</DialogTitle>
            <DialogDescription>
              Double-check the address — withdrawals can&apos;t be reversed once
              sent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 rounded-md bg-muted/50 p-3">
            <Line label="Network" value={network.label} />
            <div className="text-[11px]">
              <span className="text-muted-foreground">Address</span>
              <p className="mt-0.5 font-mono break-all">{address}</p>
            </div>
            <Line label="Amount" value={formatCurrency(Number(amount || 0))} />
            <Line label="Fee (est.)" value={formatCurrency(network.fee)} />
            <Line label="Total" value={formatCurrency(total)} strong />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={mutation.isPending}
              onClick={() =>
                mutation.mutate(
                  { amount, address: address.trim() },
                  {
                    onSuccess: () => {
                      setConfirmOpen(false);
                      setAmount("");
                      setAddress("");
                      setTouched(false);
                    },
                  },
                )
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
