import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { formatNumber } from "@/lib/utils/formatter";
import { QueryErrorCard } from "@/components/common/query-error-card";
import {
  OrderSide,
  OrderStatusBadge,
  isOpenOrder,
} from "@/modules/orders/utils/order-status";
import type { OrderDto } from "@/modules/trading/types";

export function OpenOrdersCard({
  orders,
  onCancel,
  cancelling,
  error,
  onRetry,
  priceDecimals = 2,
}: {
  orders: OrderDto[];
  onCancel: (order: OrderDto) => void;
  cancelling?: boolean;
  error?: unknown;
  onRetry?: () => unknown;
  priceDecimals?: number;
}) {
  const openOrders = orders.filter(isOpenOrder);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <QueryErrorCard
            compact
            title="Couldn't load open orders"
            error={error}
            onRetry={onRetry}
          />
        ) : openOrders.length === 0 ? (
          <EmptyState
            title="No active orders"
            description="Your live limit orders will appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Side</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Filled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {openOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <OrderSide side={order.side} />
                  </TableCell>
                  <TableCell>
                    {order.price == null
                      ? "Market"
                      : formatNumber(order.price, priceDecimals)}
                  </TableCell>
                  <TableCell>{formatNumber(order.quantity, 8)}</TableCell>
                  <TableCell>{formatNumber(order.filled, 8)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cancelling}
                      onClick={() => onCancel(order)}
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
