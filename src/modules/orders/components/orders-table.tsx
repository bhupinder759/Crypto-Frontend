import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { formatNumber } from "@/lib/utils/formatter";
import { OrderSide, OrderStatusBadge } from "@/modules/orders/utils/order-status";
import type { OrderDto } from "@/modules/trading/types";

export function OrdersTable({ orders }: { orders: OrderDto[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders available"
        description="As you trade, your order history will appear here."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Side</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>{order.symbol}</TableCell>
            <TableCell>
              <OrderSide side={order.side} />
            </TableCell>
            <TableCell>{order.type}</TableCell>
            <TableCell>
              {order.price == null ? "Market" : formatNumber(order.price, 8)}
            </TableCell>
            <TableCell>{formatNumber(order.quantity, 8)}</TableCell>
            <TableCell>
              <OrderStatusBadge status={order.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
