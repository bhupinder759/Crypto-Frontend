"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemoFaucetMutation } from "@/modules/trading/hooks/use-trading-mode";

export function DemoFaucetCard() {
  const mutation = useDemoFaucetMutation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo Faucet</CardTitle>
        <CardDescription>
          Add or reset virtual funds instantly for demo trading.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            await mutation.mutateAsync({
              amount: String(formData.get("amount") ?? ""),
              operation: String(formData.get("operation") ?? "ADD") as
                | "ADD"
                | "SET",
              asset: "USD",
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="demo-faucet-amount">USD amount</Label>
            <Input id="demo-faucet-amount" name="amount" defaultValue="10000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-faucet-operation">Operation</Label>
            <select
              id="demo-faucet-operation"
              name="operation"
              className="flex h-10 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              defaultValue="ADD"
            >
              <option value="ADD">Add funds</option>
              <option value="SET">Set balance</option>
            </select>
          </div>
          <Button className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Applying..." : "Apply demo funds"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
