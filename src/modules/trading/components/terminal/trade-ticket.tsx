"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
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
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import { bpsToRate, dec, isDecimalString } from "@/lib/utils/decimal";
import { decimalsFromIncrement, formatFixed } from "@/lib/utils/precision";
import type { AccountDto } from "@/modules/auth/types";
import {
  DEFAULT_MAKER_FEE_BPS,
  DEFAULT_TAKER_FEE_BPS,
  SUPPORTS_TIME_IN_FORCE,
} from "@/modules/trading/constants";
import {
  useCreateOrderMutation,
  useFeeSchedule,
  useLiveOrderBook,
} from "@/modules/trading/hooks/use-trading";
import { useTicketStore } from "@/modules/trading/store/ticket.store";
import { validateTicket } from "@/modules/trading/utils/ticket-validation";
import { useTradingStore } from "@/modules/trading/store/trading.store";
import type { OrderFormInput, TimeInForce } from "@/modules/trading/types";
import {
  estimateFillByBase,
  estimateFillByQuote,
  floorToIncrement,
} from "@/modules/trading/utils/orderbook";
import { usePortfolioQuery } from "@/modules/wallet/hooks/use-wallet";
import type { InstrumentDto } from "@/types/api.types";

type Side = "BUY" | "SELL";
type OrderType = "LIMIT" | "MARKET";
type AmountUnit = "BASE" | "QUOTE";

const PERCENT_MARKS = [25, 50, 75, 100];

function SegButton({
  active,
  tone = "neutral",
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  tone?: "buy" | "sell" | "neutral";
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-7 flex-1 rounded-[5px] text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? tone === "buy"
            ? "bg-buy text-buy-foreground"
            : tone === "sell"
              ? "bg-sell text-sell-foreground"
              : "bg-accent text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular", muted && "text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}

function NumberField({
  id,
  label,
  unit,
  value,
  onChange,
  disabled,
  placeholder,
  error,
}: {
  id: string;
  label: string;
  unit: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string | null;
}) {
  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex h-8 items-center rounded-md border border-input bg-background px-2 focus-within:border-ring",
          error && "border-destructive",
          disabled && "opacity-60",
        )}
      >
        <Label
          htmlFor={id}
          className="w-14 shrink-0 text-[11px] text-muted-foreground"
        >
          {label}
        </Label>
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            const next = event.target.value.replace(",", ".");
            if (next === "" || /^\d*\.?\d*$/.test(next)) onChange(next);
          }}
          className="h-7 border-0 bg-transparent px-1 text-right text-xs tabular shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <span className="ml-1 shrink-0 text-[11px] text-muted-foreground">
          {unit}
        </span>
      </div>
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}

export function TradeTicket({
  symbol,
  account,
  instrument,
}: {
  symbol: string;
  account: AccountDto | null;
  instrument: InstrumentDto | null;
}) {
  const [base = "BASE", quote = "QUOTE"] = symbol.split("-");
  const [side, setSide] = useState<Side>("BUY");
  const [type, setType] = useState<OrderType>("LIMIT");
  const [unit, setUnit] = useState<AmountUnit>("BASE");
  const [price, setPrice] = useState("");
  const [priceTouched, setPriceTouched] = useState(false);
  const [amount, setAmount] = useState("");
  const [percent, setPercent] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<OrderFormInput | null>(null);
  const [tif, setTif] = useState<TimeInForce>("GTC");
  const [postOnly, setPostOnly] = useState(false);

  const book = useLiveOrderBook(symbol);
  const lastClose = useTradingStore(
    (s) => s.realtimeBySymbol[symbol]?.lastCandle?.close ?? null,
  );
  const picked = useTicketStore((s) => s.pickedPrice);
  const skipConfirm = useTicketStore((s) => s.skipConfirm);
  const setSkipConfirm = useTicketStore((s) => s.setSkipConfirm);
  const portfolioQuery = usePortfolioQuery(account?.id);
  const mutation = useCreateOrderMutation();

  const priceIncrement = instrument?.priceIncrement ?? "0.01";
  const qtyIncrement = instrument?.quantityIncrement ?? "0.0001";
  const priceDecimals = decimalsFromIncrement(priceIncrement, 2);
  const qtyDecimals = decimalsFromIncrement(qtyIncrement, 4);
  const marketBuyAllowed = instrument?.allowMarketBuy !== false;
  const marketAllowed = instrument
    ? instrument.supportedOrderTypes.includes("MARKET")
    : true;

  const bestBid = book?.bids[0]?.[0];
  const bestAsk = book?.asks[0]?.[0];
  const seedPrice =
    (side === "BUY" ? bestAsk : bestBid) ??
    (lastClose != null ? lastClose.toFixed(priceDecimals) : undefined);

  // Adjust state during render (no effects): order-book clicks and seeding.
  const [seenNonce, setSeenNonce] = useState(picked?.nonce ?? 0);
  if (picked && picked.nonce !== seenNonce) {
    setSeenNonce(picked.nonce);
    setPrice(picked.price);
    setPriceTouched(true);
    setType("LIMIT");
  }
  if (!priceTouched && price === "" && seedPrice) {
    setPrice(seedPrice);
  }

  const balances = portfolioQuery.data;
  const available = useMemo(() => {
    const find = (asset: string) =>
      dec(balances?.find((b) => b.asset === asset)?.available);
    return { base: find(base), quote: find(quote) };
  }, [balances, base, quote]);

  const isReal = account?.mode === "REAL";
  const feeQuery = useFeeSchedule(isReal ? "REAL" : "DEMO", account?.id);
  const tifEnabled = SUPPORTS_TIME_IN_FORCE && isReal && type === "LIMIT";
  const makerOnly = tifEnabled && postOnly;
  const feeBps = isReal
    ? makerOnly
      ? (feeQuery.data?.makerFeeBps ?? DEFAULT_MAKER_FEE_BPS)
      : (feeQuery.data?.takerFeeBps ?? DEFAULT_TAKER_FEE_BPS)
    : 0;
  const feeRate = bpsToRate(feeBps);
  const feeEstimated = isReal && !feeQuery.data;

  const effectiveUnit: AmountUnit =
    type === "MARKET" && side === "BUY" ? unit : "BASE";
  const isMarketBuyBlocked =
    type === "MARKET" && side === "BUY" && !marketBuyAllowed;
  /** REAL accounts send `quoteOrderQty`; DEMO converts the budget to base qty. */
  const sendQuoteQty = isReal && effectiveUnit === "QUOTE";

  /** Derived order amounts (Decimal) for display, validation and submit. */
  const calc = useMemo(() => {
    if (type === "LIMIT") {
      const qty = dec(amount);
      const avgPrice = dec(price);
      return {
        qty,
        notional: qty.mul(avgPrice),
        avgPrice,
        insufficientLiquidity: false,
      };
    }
    const levels = side === "BUY" ? (book?.asks ?? []) : (book?.bids ?? []);
    const est =
      effectiveUnit === "QUOTE"
        ? estimateFillByQuote(levels, dec(amount).toNumber())
        : estimateFillByBase(levels, dec(amount).toNumber());
    return {
      qty:
        effectiveUnit === "QUOTE"
          ? dec(floorToIncrement(est.baseQty, qtyIncrement))
          : dec(amount),
      notional: effectiveUnit === "QUOTE" ? dec(amount) : dec(est.quoteCost),
      avgPrice: dec(est.avgPrice),
      insufficientLiquidity: dec(amount).gt(0) && est.insufficientLiquidity,
    };
  }, [amount, book, effectiveUnit, price, qtyIncrement, side, type]);

  // Fee is charged in the asset received: base on buys, quote on sells.
  const feeAsset = side === "BUY" ? base : quote;
  const fee =
    side === "BUY" ? calc.qty.mul(feeRate) : calc.notional.mul(feeRate);
  const spendAsset = side === "BUY" ? quote : base;
  const spendAvailable = side === "BUY" ? available.quote : available.base;
  const spendRequired = side === "BUY" ? calc.notional : calc.qty;

  const applyPercent = (pct: number) => {
    setPercent(pct);
    if (pct === 0) {
      setAmount("");
      return;
    }
    const share = dec(pct).div(100);
    if (side === "SELL") {
      setAmount(
        floorToIncrement(available.base.mul(share).toFixed(), qtyIncrement),
      );
      return;
    }
    const budget = available.quote.mul(share);
    if (effectiveUnit === "QUOTE") {
      setAmount(floorToIncrement(budget.toFixed(), "0.01"));
      return;
    }
    const refPrice =
      type === "LIMIT"
        ? dec(price)
        : dec(
            estimateFillByQuote(book?.asks ?? [], budget.toNumber()).avgPrice,
          );
    setAmount(
      refPrice.gt(0)
        ? floorToIncrement(budget.div(refPrice).toFixed(), qtyIncrement)
        : "",
    );
  };

  // ---- validation -------------------------------------------------------
  const qtyString =
    effectiveUnit === "QUOTE"
      ? calc.qty.gt(0)
        ? calc.qty.toFixed()
        : ""
      : amount;
  const ticketErrors = validateTicket({
    // Typed-but-empty amount (e.g. quote too small to buy one step) is still an error.
    quantity: amount === "" ? "" : qtyString || "0",
    price,
    type,
    rules: instrument
      ? {
          minQuantity: instrument.minQuantity,
          quantityIncrement: instrument.quantityIncrement,
          priceIncrement: instrument.priceIncrement,
          baseAsset: base,
        }
      : null,
  });
  const amountError =
    effectiveUnit === "QUOTE" && amount !== "" && !isDecimalString(amount, 2)
      ? "Use up to 2 decimals"
      : ticketErrors.amountError;
  const { priceError } = ticketErrors;
  const insufficientBalance =
    Boolean(account) && spendRequired.gt(0) && spendRequired.gt(spendAvailable);

  const canSubmit =
    Boolean(account && instrument) &&
    amount !== "" &&
    !amountError &&
    !priceError &&
    (type === "MARKET" || price !== "") &&
    !insufficientBalance &&
    !isMarketBuyBlocked &&
    !calc.insufficientLiquidity &&
    !mutation.isPending;

  const buildPayload = (): OrderFormInput | null => {
    if (!account) return null;
    if (!sendQuoteQty && !qtyString) return null;
    return {
      accountId: account.id,
      symbol,
      side,
      type,
      ...(sendQuoteQty ? { quoteOrderQty: amount } : { quantity: qtyString }),
      price: type === "LIMIT" ? price : undefined,
      ...(tifEnabled ? { timeInForce: postOnly ? "GTC" : tif, postOnly } : {}),
      clientOrderId: crypto.randomUUID(),
    };
  };

  const submit = (payload: OrderFormInput) => {
    mutation.mutate(payload, {
      onSuccess: () => {
        setAmount("");
        setPercent(0);
      },
    });
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = buildPayload();
    if (!payload || !canSubmit) return;
    if (skipConfirm) {
      submit(payload);
    } else {
      setPending(payload);
      setConfirmOpen(true);
    }
  };

  const sideTone = side === "BUY" ? "buy" : "sell";

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col gap-2 p-2">
      <div className="flex gap-0.5 rounded-md bg-muted p-0.5">
        <SegButton
          active={side === "BUY"}
          tone="buy"
          onClick={() => setSide("BUY")}
        >
          Buy
        </SegButton>
        <SegButton
          active={side === "SELL"}
          tone="sell"
          onClick={() => setSide("SELL")}
        >
          Sell
        </SegButton>
      </div>

      <div className="flex items-center gap-3 text-xs">
        {(["LIMIT", "MARKET"] as const).map((option) => {
          const disabled = option === "MARKET" && !marketAllowed;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => setType(option)}
              className={cn(
                "font-medium disabled:opacity-40",
                type === option
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option === "LIMIT" ? "Limit" : "Market"}
            </button>
          );
        })}
        {type === "MARKET" && side === "BUY" && marketBuyAllowed ? (
          <div className="ml-auto flex gap-0.5 rounded bg-muted p-0.5 text-[10px]">
            {(["BASE", "QUOTE"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  setUnit(u);
                  setAmount("");
                  setPercent(0);
                }}
                className={cn(
                  "rounded px-1.5 py-0.5",
                  unit === u
                    ? "bg-background text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {u === "BASE" ? base : quote}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {type === "LIMIT" ? (
        <NumberField
          id="ticket-price"
          label="Price"
          unit={quote}
          value={price}
          error={priceError}
          onChange={(value) => {
            setPrice(value);
            setPriceTouched(true);
          }}
        />
      ) : (
        <div className="flex h-8 items-center justify-between rounded-md border border-dashed border-input px-2 text-[11px] text-muted-foreground">
          <span>Price</span>
          <span>Market</span>
        </div>
      )}

      <NumberField
        id="ticket-amount"
        label={effectiveUnit === "QUOTE" ? "Total" : "Amount"}
        unit={effectiveUnit === "QUOTE" ? quote : base}
        value={amount}
        error={amountError}
        placeholder={
          effectiveUnit === "BASE" && instrument
            ? `Min ${instrument.minQuantity}`
            : "0.00"
        }
        onChange={(value) => {
          setAmount(value);
          setPercent(0);
        }}
      />

      <div className="space-y-1.5 px-0.5 pt-1">
        <Slider
          value={[percent]}
          min={0}
          max={100}
          step={1}
          disabled={!account}
          onValueChange={(value) => applyPercent(value[0] ?? 0)}
          aria-label="Percent of available balance"
        />
        <div className="flex justify-between">
          {PERCENT_MARKS.map((mark) => (
            <button
              key={mark}
              type="button"
              disabled={!account}
              onClick={() => applyPercent(mark)}
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] tabular text-muted-foreground hover:bg-accent hover:text-foreground",
                percent === mark && "bg-accent text-foreground",
              )}
            >
              {mark}%
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1 rounded-md bg-muted/50 p-2">
        <Row
          label="Available"
          value={
            account
              ? `${formatFixed(spendAvailable.toFixed(), side === "BUY" ? 2 : qtyDecimals)} ${spendAsset}`
              : "--"
          }
        />
        {type === "MARKET" ? (
          <Row
            label="Est. avg price"
            value={
              calc.avgPrice.gt(0)
                ? formatFixed(calc.avgPrice.toFixed(), priceDecimals)
                : "--"
            }
          />
        ) : null}
        {effectiveUnit === "QUOTE" ? (
          <Row
            label={`Est. ${base}`}
            value={formatFixed(calc.qty.toFixed(), qtyDecimals)}
          />
        ) : (
          <Row
            label={side === "BUY" ? "Est. cost" : "Est. proceeds"}
            value={
              calc.notional.gt(0)
                ? `${formatFixed(calc.notional.toFixed(), 2)} ${quote}`
                : "--"
            }
          />
        )}
        <Row
          label={
            isReal
              ? `${feeEstimated ? "Est. fee" : "Fee"} (${dec(feeBps).div(100).toFixed()}% ${makerOnly ? "maker" : "taker"})`
              : "Fee (demo)"
          }
          value={
            !isReal
              ? "None"
              : fee.gt(0)
                ? `${formatFixed(fee.toFixed(), side === "BUY" ? qtyDecimals : 4)} ${feeAsset}`
                : "--"
          }
          muted
        />
      </div>

      {tifEnabled ? (
        <div className="flex items-center gap-2 text-[11px]">
          <Select
            value={tif}
            onValueChange={(v) => setTif(v as TimeInForce)}
            disabled={postOnly}
          >
            <SelectTrigger
              size="sm"
              className="h-7 w-24 px-2 text-[11px]"
              aria-label="Time in force"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GTC" className="text-xs">
                GTC
              </SelectItem>
              <SelectItem value="IOC" className="text-xs">
                IOC
              </SelectItem>
              <SelectItem value="FOK" className="text-xs">
                FOK
              </SelectItem>
            </SelectContent>
          </Select>
          <label className="ml-auto flex items-center gap-1.5 text-muted-foreground">
            <Switch
              size="sm"
              checked={postOnly}
              onCheckedChange={setPostOnly}
            />
            Post-only
          </label>
        </div>
      ) : null}

      {isMarketBuyBlocked ? (
        <p className="rounded-md border border-warning/30 bg-warning/10 px-2 py-1.5 text-[11px] text-warning">
          Market buys aren&apos;t enabled for this market yet. Use a limit
          order.
        </p>
      ) : calc.insufficientLiquidity ? (
        <p className="text-[11px] text-warning">
          Not enough liquidity on the book for this size.
        </p>
      ) : insufficientBalance ? (
        <p className="text-[11px] text-destructive">
          Insufficient {spendAsset} balance.
        </p>
      ) : null}

      <div className="mt-auto">
        {account ? (
          <Button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "h-9 w-full font-semibold",
              sideTone === "buy"
                ? "bg-buy text-buy-foreground hover:bg-buy/90"
                : "bg-sell text-sell-foreground hover:bg-sell/90",
            )}
          >
            {mutation.isPending
              ? "Placing…"
              : `${side === "BUY" ? "Buy" : "Sell"} ${base}`}
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="outline" className="h-9 w-full">
                <Link href={routes.settings as Route}>
                  Create a trading account
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              You need an account to place orders.
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Confirm {pending?.side === "BUY" ? "buy" : "sell"} order
            </DialogTitle>
            <DialogDescription>
              Review the details before placing.
            </DialogDescription>
          </DialogHeader>
          {pending ? (
            <div className="space-y-1.5 rounded-md bg-muted/50 p-3">
              <Row label="Market" value={symbol} />
              <Row label="Side" value={pending.side} />
              <Row
                label="Type"
                value={pending.type === "LIMIT" ? "Limit" : "Market"}
              />
              <Row
                label="Price"
                value={pending.price ? `${pending.price} ${quote}` : "Market"}
              />
              <Row
                label={pending.quoteOrderQty ? "Spend" : "Amount"}
                value={
                  pending.quoteOrderQty
                    ? `${pending.quoteOrderQty} ${quote}`
                    : `${pending.quantity} ${base}`
                }
              />
              {pending.timeInForce ? (
                <Row
                  label="Time in force"
                  value={`${pending.timeInForce}${pending.postOnly ? " · post-only" : ""}`}
                />
              ) : null}
              <Row
                label={pending.side === "BUY" ? "Est. cost" : "Est. proceeds"}
                value={`${formatFixed(calc.notional.toFixed(), 2)} ${quote}`}
              />
              <Row
                label={isReal ? "Fee" : "Fee (demo)"}
                value={
                  isReal
                    ? `${formatFixed(fee.toFixed(), 6)} ${feeAsset}`
                    : "None"
                }
                muted
              />
            </div>
          ) : null}
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              size="sm"
              checked={skipConfirm}
              onCheckedChange={setSkipConfirm}
            />
            Don&apos;t ask again
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className={
                pending?.side === "BUY"
                  ? "bg-buy text-buy-foreground hover:bg-buy/90"
                  : "bg-sell text-sell-foreground hover:bg-sell/90"
              }
              onClick={() => {
                if (pending) submit(pending);
                setConfirmOpen(false);
              }}
            >
              Place order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
