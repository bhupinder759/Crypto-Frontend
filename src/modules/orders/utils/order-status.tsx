import { Badge } from "@/components/ui/badge";

/** Statuses that still rest on the book and can be cancelled. */
export const OPEN_ORDER_STATUSES = new Set([
  "NEW",
  "OPEN",
  "PENDING",
  "ACCEPTED",
  "PARTIAL",
  "PARTIAL_FILL",
  "PARTIALLY_FILLED",
]);

export function isOpenOrder(order: { status: string }) {
  return OPEN_ORDER_STATUSES.has(order.status.toUpperCase());
}

type BadgeVariant = "default" | "success" | "danger" | "warning" | "info" | "muted";

const statusVariant: Record<string, BadgeVariant> = {
  NEW: "info",
  OPEN: "info",
  PENDING: "info",
  ACCEPTED: "info",
  PARTIAL: "warning",
  PARTIAL_FILL: "warning",
  PARTIALLY_FILLED: "warning",
  FILLED: "success",
  CANCELLED: "muted",
  CANCELED: "muted",
  EXPIRED: "muted",
  REJECTED: "danger",
  FAILED: "danger",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const key = status.toUpperCase();
  return (
    <Badge variant={statusVariant[key] ?? "default"}>
      {key.replace(/_/g, " ")}
    </Badge>
  );
}

export function OrderSide({ side }: { side: "BUY" | "SELL" | string }) {
  return (
    <span
      className={
        side === "BUY" ? "font-medium text-buy" : "font-medium text-sell"
      }
    >
      {side}
    </span>
  );
}
