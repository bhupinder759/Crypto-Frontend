import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { formatNumber, formatTimestamp } from "@/lib/utils/formatter";
import type { TradeDto } from "@/types/api.types";

export function RecentTradesCard({ trades }: { trades: TradeDto[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <EmptyState
            title="No fills yet"
            description="Executed trades will stream here in real time."
          />
        ) : (
          <div className="space-y-2">
            {trades.slice(0, 12).map((trade) => (
              <div
                key={trade.id}
                className="grid grid-cols-[1fr_1fr_auto] items-center text-sm"
              >
                <span className="font-medium text-foreground">
                  {formatNumber(trade.price, 2)}
                </span>
                <span className="text-muted-foreground">
                  {formatNumber(trade.quantity, 4)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(trade.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
