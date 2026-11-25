"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/utils/formatter";
import { formatFixed } from "@/lib/utils/precision";
import { OrderSide } from "@/modules/orders/utils/order-status";
import type { FillDto } from "@/modules/trading/types";

const FillRow = memo(function FillRow({
  fill,
  priceDecimals,
  compact,
}: {
  fill: FillDto;
  priceDecimals: number;
  compact?: boolean;
}) {
  const cell = "h-7 px-2 text-[11px] whitespace-nowrap";
  return (
    <tr className="border-b border-border/60 hover:bg-accent/40">
      <td className={cn(cell, "text-muted-foreground")}>
        {formatTimestamp(fill.timestamp)}
      </td>
      <td className={cn(cell, "font-medium")}>{fill.symbol}</td>
      <td className={cell}>
        <OrderSide side={fill.side} />
      </td>
      <td className={cn(cell, "text-right tabular")}>
        {formatFixed(fill.price, priceDecimals)}
      </td>
      <td className={cn(cell, "text-right tabular")}>{fill.quantity}</td>
      {compact ? null : (
        <td className={cn(cell, "text-right tabular")}>
          {formatFixed(fill.quoteQuantity, 2)}
        </td>
      )}
      <td className={cn(cell, "text-right tabular text-muted-foreground")}>
        {fill.fee} {fill.feeAsset}
      </td>
      {compact ? null : (
        <td className={cn(cell, "text-right text-muted-foreground")}>
          {fill.liquidity === "MAKER" ? "Maker" : "Taker"}
        </td>
      )}
    </tr>
  );
});

export function FillsTable({
  fills,
  priceDecimals = 2,
  compact = false,
  empty = "No trades yet",
}: {
  fills: FillDto[];
  priceDecimals?: number;
  compact?: boolean;
  empty?: string;
}) {
  if (fills.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
        {empty}
      </div>
    );
  }
  const head = "h-6 px-2 text-[10px] font-normal text-muted-foreground";
  return (
    <table
      className={cn("w-full border-collapse", !compact && "min-w-[620px]")}
    >
      <thead className="sticky top-0 bg-card">
        <tr className="border-b border-border">
          <th className={cn(head, "text-left")}>Time</th>
          <th className={cn(head, "text-left")}>Market</th>
          <th className={cn(head, "text-left")}>Side</th>
          <th className={cn(head, "text-right")}>Price</th>
          <th className={cn(head, "text-right")}>Qty</th>
          {compact ? null : <th className={cn(head, "text-right")}>Total</th>}
          <th className={cn(head, "text-right")}>Fee</th>
          {compact ? null : <th className={cn(head, "text-right")}>Role</th>}
        </tr>
      </thead>
      <tbody>
        {fills.map((fill) => (
          <FillRow
            key={fill.tradeId}
            fill={fill}
            priceDecimals={priceDecimals}
            compact={compact}
          />
        ))}
      </tbody>
    </table>
  );
}
