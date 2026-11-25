"use client";

import { memo, useMemo, useState } from "react";
import { X } from "lucide-react";
import { QueryErrorCard } from "@/components/common/query-error-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatFixed } from "@/lib/utils/precision";
import type { AccountDto } from "@/modules/auth/types";
import { useOrdersHistoryQuery } from "@/modules/orders/hooks/use-orders";
import {
  OrderSide,
  OrderStatusBadge,
  isOpenOrder,
} from "@/modules/orders/utils/order-status";
import {
  useCancelOrderMutation,
  useFillNotifications,
  useOpenOrdersQuery,
} from "@/modules/trading/hooks/use-trading";
import type { OrderDto } from "@/modules/trading/types";

type Column =
  | "symbol"
  | "side"
  | "type"
  | "price"
  | "amount"
  | "filled"
  | "status"
  | "action";

const headers: Record<Column, string> = {
  symbol: "Market",
  side: "Side",
  type: "Type",
  price: "Price",
  amount: "Amount",
  filled: "Filled",
  status: "Status",
  action: "",
};

const OrderRow = memo(function OrderRow({
  order,
  columns,
  priceDecimals,
  onCancel,
  cancelling,
}: {
  order: OrderDto;
  columns: Column[];
  priceDecimals: number;
  onCancel?: (order: OrderDto) => void;
  cancelling?: boolean;
}) {
  const pending = order.id.startsWith("pending-");
  const filledPct =
    Number(order.quantity) > 0
      ? (Number(order.filled) / Number(order.quantity)) * 100
      : 0;

  const cell = (column: Column) => {
    switch (column) {
      case "symbol":
        return <span className="font-medium">{order.symbol}</span>;
      case "side":
        return <OrderSide side={order.side} />;
      case "type":
        return order.type === "LIMIT" ? "Limit" : "Market";
      case "price":
        return order.price == null
          ? "Market"
          : formatFixed(order.price, priceDecimals);
      case "amount":
        return order.quantity;
      case "filled":
        return `${order.filled} (${filledPct.toFixed(0)}%)`;
      case "status":
        return <OrderStatusBadge status={order.status} />;
      case "action":
        return onCancel ? (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Cancel order"
            disabled={pending || cancelling}
            onClick={() => onCancel(order)}
          >
            <X />
          </Button>
        ) : null;
    }
  };

  return (
    <tr
      className={cn(
        "border-b border-border/60 hover:bg-accent/40",
        pending && "opacity-60",
      )}
    >
      {columns.map((column) => (
        <td
          key={column}
          className={cn(
            "h-7 px-2 text-[11px] whitespace-nowrap",
            column !== "symbol" &&
              column !== "side" &&
              column !== "type" &&
              "text-right",
          )}
        >
          {cell(column)}
        </td>
      ))}
    </tr>
  );
});

function OrdersTable({
  orders,
  columns,
  priceDecimals,
  empty,
  onCancel,
  cancelling,
}: {
  orders: OrderDto[];
  columns: Column[];
  priceDecimals: number;
  empty: string;
  onCancel?: (order: OrderDto) => void;
  cancelling?: boolean;
}) {
  if (orders.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
        {empty}
      </div>
    );
  }
  return (
    <table className="w-full min-w-[560px] border-collapse">
      <thead className="sticky top-0 bg-card">
        <tr className="border-b border-border">
          {columns.map((column) => (
            <th
              key={column}
              className={cn(
                "h-6 px-2 text-[10px] font-normal text-muted-foreground",
                column === "symbol" || column === "side" || column === "type"
                  ? "text-left"
                  : "text-right",
              )}
            >
              {headers[column]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            columns={columns}
            priceDecimals={priceDecimals}
            onCancel={onCancel}
            cancelling={cancelling}
          />
        ))}
      </tbody>
    </table>
  );
}

export function OrdersPanel({
  symbol,
  account,
  priceDecimals,
}: {
  symbol: string;
  account: AccountDto | null;
  priceDecimals: number;
}) {
  const [thisMarketOnly, setThisMarketOnly] = useState(true);
  const openQuery = useOpenOrdersQuery(
    account?.id,
    thisMarketOnly ? symbol : undefined,
  );
  const historyQuery = useOrdersHistoryQuery(account?.id);
  const cancelMutation = useCancelOrderMutation();
  useFillNotifications(openQuery.data);

  const openOrders = useMemo(
    () => (openQuery.data ?? []).filter(isOpenOrder),
    [openQuery.data],
  );
  const history = useMemo(() => {
    const all = historyQuery.data ?? [];
    return thisMarketOnly ? all.filter((o) => o.symbol === symbol) : all;
  }, [historyQuery.data, symbol, thisMarketOnly]);
  const closed = useMemo(
    () => history.filter((o) => !isOpenOrder(o)),
    [history],
  );
  // Until the private fills stream lands (backend 2.3), fills = orders with executed size.
  const fills = useMemo(
    () => history.filter((o) => Number(o.filled) > 0),
    [history],
  );

  const onCancel = (order: OrderDto) =>
    cancelMutation.mutate({ orderId: order.id, accountId: order.accountId });

  if (!account) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Create a trading account to see your orders.
      </div>
    );
  }

  return (
    <Tabs defaultValue="open" className="flex h-full min-h-0 flex-col gap-0">
      <div className="flex items-center justify-between gap-2 border-b border-border px-2">
        <TabsList variant="line" className="h-8">
          <TabsTrigger value="open" className="text-xs">
            Open orders{openOrders.length ? ` (${openOrders.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            Order history
          </TabsTrigger>
          <TabsTrigger value="fills" className="text-xs">
            Trade history
          </TabsTrigger>
        </TabsList>
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Switch
            size="sm"
            checked={thisMarketOnly}
            onCheckedChange={setThisMarketOnly}
          />
          {symbol} only
        </label>
      </div>
      <TabsContent value="open" className="min-h-0 flex-1 overflow-auto">
        {openQuery.isError ? (
          <QueryErrorCard
            compact
            className="m-2"
            title="Couldn't load open orders"
            error={openQuery.error}
            onRetry={openQuery.refetch}
          />
        ) : (
          <OrdersTable
            orders={openOrders}
            columns={[
              "symbol",
              "side",
              "type",
              "price",
              "amount",
              "filled",
              "status",
              "action",
            ]}
            priceDecimals={priceDecimals}
            empty="No open orders"
            onCancel={onCancel}
            cancelling={cancelMutation.isPending}
          />
        )}
      </TabsContent>
      <TabsContent value="history" className="min-h-0 flex-1 overflow-auto">
        {historyQuery.isError ? (
          <QueryErrorCard
            compact
            className="m-2"
            title="Couldn't load order history"
            error={historyQuery.error}
            onRetry={historyQuery.refetch}
          />
        ) : (
          <OrdersTable
            orders={closed}
            columns={[
              "symbol",
              "side",
              "type",
              "price",
              "amount",
              "filled",
              "status",
            ]}
            priceDecimals={priceDecimals}
            empty="No past orders"
          />
        )}
      </TabsContent>
      <TabsContent value="fills" className="min-h-0 flex-1 overflow-auto">
        {historyQuery.isError ? (
          <QueryErrorCard
            compact
            className="m-2"
            title="Couldn't load trades"
            error={historyQuery.error}
            onRetry={historyQuery.refetch}
          />
        ) : (
          <OrdersTable
            orders={fills}
            columns={["symbol", "side", "type", "price", "filled", "status"]}
            priceDecimals={priceDecimals}
            empty="No trades yet"
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
