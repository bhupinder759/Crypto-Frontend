import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { formatNumber } from "@/lib/utils/formatter";
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
            <TableCell>{order.side}</TableCell>
            <TableCell>{order.type}</TableCell>
            <TableCell>{formatNumber(order.price ?? 0, 2)}</TableCell>
            <TableCell>{formatNumber(order.quantity, 4)}</TableCell>
            <TableCell>
              <Badge variant={order.status === "FILLED" ? "success" : "info"}>
                {order.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
