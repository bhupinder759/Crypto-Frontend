import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { formatNumber } from "@/lib/utils/formatter";
import type { PortfolioBalanceDto } from "@/modules/wallet/types";

export function WalletBalanceList({ balances }: { balances: PortfolioBalanceDto[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Balances</CardTitle>
      </CardHeader>
      <CardContent>
        {balances.length === 0 ? (
          <EmptyState
            title="No balances yet"
            description="Fund the account or settle trades to populate the wallet."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map((balance) => (
                <TableRow key={balance.id}>
                  <TableCell>{balance.asset}</TableCell>
                  <TableCell>{formatNumber(balance.available, 4)}</TableCell>
                  <TableCell>{formatNumber(balance.reserved, 4)}</TableCell>
                  <TableCell>{formatNumber(balance.total, 4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
