"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateDepositMutation } from "@/modules/wallet/hooks/use-wallet";

export function DepositForm() {
  const mutation = useCreateDepositMutation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mock Deposit</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            await mutation.mutateAsync({
              amount: String(formData.get("amount") ?? ""),
              address: String(formData.get("address") ?? ""),
              txHash:
                String(formData.get("txHash") ?? "") || globalThis.crypto.randomUUID(),
            });
            form.reset();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">Amount</Label>
            <Input id="deposit-amount" name="amount" defaultValue="1000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit-address">Address</Label>
            <Input id="deposit-address" name="address" defaultValue="mock-wallet-address" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit-tx">TX hash</Label>
            <Input id="deposit-tx" name="txHash" placeholder="Leave empty to auto-generate" />
          </div>
          <Button className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Submitting..." : "Register deposit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
