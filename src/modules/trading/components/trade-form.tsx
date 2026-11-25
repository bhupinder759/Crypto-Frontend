"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateOrderMutation } from "@/modules/trading/hooks/use-trading";
import type { AccountDto } from "@/modules/auth/types";
import { usePortfolioQuery } from "@/modules/wallet/hooks/use-wallet";
import type { PortfolioBalanceDto } from "@/modules/wallet/types";
import type { InstrumentDto, OrderBookDto, TickerDto } from "@/types/api.types";
import { formatNumber } from "@/lib/utils/formatter";

const orderSchema = z.object({
  side: z.enum(["BUY", "SELL"]),
  type: z.enum(["LIMIT", "MARKET"]),
  quantity: z.string().min(1, "Quantity is required"),
  price: z.string(),
});

type OrderSchema = z.infer<typeof orderSchema>;

function findBalance(
  portfolio: PortfolioBalanceDto[] | undefined,
  asset: string | undefined,
) {
  if (!portfolio || !asset) {
    return null;
  }

  return portfolio.find((balance) => balance.asset === asset) ?? null;
}

export function TradeForm({
  symbol,
  account,
  instrument,
  ticker,
  orderBook,
}: {
  symbol: string;
  account: AccountDto | null;
  instrument: InstrumentDto | null;
  ticker: TickerDto | null;
  orderBook: OrderBookDto | null;
}) {
  const mutation = useCreateOrderMutation();
  const portfolioQuery = usePortfolioQuery(account?.id);
  const form = useForm<OrderSchema>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      side: "BUY",
      type: "LIMIT",
      quantity: "1",
      price: "",
    },
  });

  const side = useWatch({ control: form.control, name: "side" });
  const type = useWatch({ control: form.control, name: "type" });
  const quantity = useWatch({ control: form.control, name: "quantity" });
  const price = useWatch({ control: form.control, name: "price" });
  const bestBid = orderBook?.bids[0]?.[0] ?? null;
  const bestAsk = orderBook?.asks[0]?.[0] ?? null;
  const referencePrice =
    type === "LIMIT"
      ? price || (side === "BUY" ? bestAsk : bestBid) || ticker?.lastPrice || "0"
      : (side === "SELL" ? bestBid : bestAsk) || ticker?.lastPrice || "0";
  const estimatedNotional = Number(quantity || 0) * Number(referencePrice || 0);
  const portfolio = portfolioQuery.data;
  const baseBalance = findBalance(portfolio, instrument?.baseAsset);
  const quoteBalance = findBalance(portfolio, instrument?.quoteAsset);
  const requiredAsset = side === "BUY" ? instrument?.quoteAsset : instrument?.baseAsset;
  const requiredAmount =
    side === "BUY" ? estimatedNotional : Number(quantity || 0);
  const availableBalance =
    side === "BUY"
      ? Number(quoteBalance?.available ?? 0)
      : Number(baseBalance?.available ?? 0);
  const marketBuyDisabled =
    type === "MARKET" && side === "BUY" && instrument?.allowMarketBuy === false;

  useEffect(() => {
    if (type === "MARKET") {
      form.setValue("price", "", { shouldDirty: false });
      return;
    }

    if (form.getValues("price")) {
      return;
    }

    const seededPrice = side === "BUY" ? bestAsk : bestBid;
    if (seededPrice) {
      form.setValue("price", seededPrice, { shouldDirty: false });
    } else if (ticker?.lastPrice) {
      form.setValue("price", ticker.lastPrice, { shouldDirty: false });
    }
  }, [bestAsk, bestBid, form, side, ticker?.lastPrice, type]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Ticket</CardTitle>
        <CardDescription>
          Limit and market orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            if (!account) {
              return;
            }

            if (!instrument) {
              toast.error("Instrument metadata is still loading");
              return;
            }

            if (!/^[1-9]\d*$/.test(values.quantity)) {
              form.setError("quantity", {
                message: "Use a whole-number quantity greater than zero",
              });
              return;
            }

            if (Number(values.quantity) < Number(instrument.minQuantity)) {
              form.setError("quantity", {
                message: `Minimum quantity is ${instrument.minQuantity}`,
              });
              return;
            }

            const quantityBigInt = BigInt(values.quantity);
            const quantityIncrement = BigInt(instrument.quantityIncrement);

            if (quantityBigInt % quantityIncrement !== BigInt(0)) {
              form.setError("quantity", {
                message: `Quantity must align with increment ${instrument.quantityIncrement}`,
              });
              return;
            }

            if (marketBuyDisabled) {
              toast.error("Market buy orders are disabled on the current engine");
              return;
            }

            if (values.type === "LIMIT") {
              if (!/^[1-9]\d*$/.test(values.price)) {
                form.setError("price", {
                  message: "Use a whole-number limit price greater than zero",
                });
                return;
              }

              const priceBigInt = BigInt(values.price);
              const priceIncrement = BigInt(instrument.priceIncrement);

              if (priceBigInt % priceIncrement !== BigInt(0)) {
                form.setError("price", {
                  message: `Price must align with increment ${instrument.priceIncrement}`,
                });
                return;
              }
            }

            await mutation.mutateAsync({
              accountId: account.id,
              symbol,
              side: values.side,
              type: values.type,
              quantity: values.quantity,
              price: values.type === "LIMIT" ? values.price : undefined,
              clientOrderId: crypto.randomUUID(),
            });
          })}
        >
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={side === "BUY" ? "default" : "outline"}
              onClick={() => form.setValue("side", "BUY")}
            >
              Buy
            </Button>
            <Button
              type="button"
              variant={side === "SELL" ? "destructive" : "outline"}
              onClick={() => form.setValue("side", "SELL")}
            >
              Sell
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Order type</Label>
            <select
              id="type"
              className="flex h-10 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              {...form.register("type")}
            >
              <option value="LIMIT">Limit</option>
              <option value="MARKET">Market</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              inputMode="numeric"
              placeholder={instrument?.minQuantity ?? "1"}
              {...form.register("quantity")}
            />
            {form.formState.errors.quantity ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.quantity.message}
              </p>
            ) : instrument ? (
              <p className="text-xs text-muted-foreground">
                Min {instrument.minQuantity} {instrument.baseAsset}, increment {instrument.quantityIncrement}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Limit price</Label>
            <Input
              id="price"
              inputMode="numeric"
              disabled={type === "MARKET"}
              placeholder={
                type === "MARKET"
                  ? "Market orders execute from the book"
                  : instrument?.priceIncrement ?? "1"
              }
              {...form.register("price")}
            />
            {form.formState.errors.price ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.price.message}
              </p>
            ) : type === "MARKET" ? (
              <p className="text-xs text-muted-foreground">
                {side === "SELL"
                  ? "Estimated against current best bid."
                  : "Market buy is disabled until quote-side pricing logic is implemented."}
              </p>
            ) : instrument ? (
              <p className="text-xs text-muted-foreground">
                Increment {instrument.priceIncrement} {instrument.quoteAsset}
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
              <p className="text-muted-foreground">Estimated notional</p>
              <p className="font-medium text-foreground">
                {formatNumber(estimatedNotional, 2)} {instrument?.quoteAsset ?? "USD"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Reference price {formatNumber(referencePrice, 2)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
              <p className="text-muted-foreground">Required balance</p>
              <p className="font-medium text-foreground">
                {formatNumber(requiredAmount, 4)} {requiredAsset ?? "--"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Available {formatNumber(availableBalance, 4)} {requiredAsset ?? "--"}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 p-4 text-sm">
              <p className="text-muted-foreground">
                {instrument?.baseAsset ?? "Base"} available
              </p>
              <p className="font-medium text-foreground">
                {formatNumber(baseBalance?.available ?? 0, 4)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Reserved {formatNumber(baseBalance?.reserved ?? 0, 4)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 p-4 text-sm">
              <p className="text-muted-foreground">
                {instrument?.quoteAsset ?? "Quote"} available
              </p>
              <p className="font-medium text-foreground">
                {formatNumber(quoteBalance?.available ?? 0, 2)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Reserved {formatNumber(quoteBalance?.reserved ?? 0, 2)}
              </p>
            </div>
          </div>
          {marketBuyDisabled ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
              Market buy is intentionally blocked until the engine supports quote-side spend caps. Use a limit buy or a market sell.
            </div>
          ) : null}
          <Button
            className="h-11 w-full"
            disabled={!account || !instrument || mutation.isPending || marketBuyDisabled}
          >
            {mutation.isPending ? "Submitting..." : `Place ${side} order`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
