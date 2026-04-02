import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { formatNumber } from "@/lib/utils/formatter";
import type { OrderBookDto } from "@/types/api.types";

export function OrderBookCard({ orderBook }: { orderBook: OrderBookDto | null }) {
  if (!orderBook) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Book</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No liquidity snapshot yet"
            description="Connect market activity or place orders to populate the book."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Order Book</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Bids
          </p>
          <div className="space-y-2">
            {orderBook.bids.slice(0, 10).map(([price, quantity]) => (
              <div key={`${price}-${quantity}`} className="grid grid-cols-2 text-sm">
                <span className="text-emerald-500">{formatNumber(price, 2)}</span>
                <span className="text-right text-muted-foreground">
                  {formatNumber(quantity, 4)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Asks
          </p>
          <div className="space-y-2">
            {orderBook.asks.slice(0, 10).map(([price, quantity]) => (
              <div key={`${price}-${quantity}`} className="grid grid-cols-2 text-sm">
                <span className="text-rose-500">{formatNumber(price, 2)}</span>
                <span className="text-right text-muted-foreground">
                  {formatNumber(quantity, 4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
