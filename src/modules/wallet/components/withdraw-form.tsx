"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequestWithdrawalMutation } from "@/modules/wallet/hooks/use-wallet";

export function WithdrawForm() {
  const mutation = useRequestWithdrawalMutation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Withdrawal</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            await mutation.mutateAsync({
              amount: String(formData.get("amount") ?? ""),
              address: String(formData.get("address") ?? ""),
            });
            event.currentTarget.reset();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Amount</Label>
            <Input id="withdraw-amount" name="amount" defaultValue="250" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdraw-address">Destination address</Label>
            <Input id="withdraw-address" name="address" defaultValue="destination-wallet-address" />
          </div>
          <Button className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Requesting..." : "Request withdrawal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
