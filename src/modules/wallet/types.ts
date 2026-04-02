export interface PortfolioBalanceDto {
  id: string;
  accountId: string;
  asset: string;
  available: string;
  reserved: string;
  total: string;
}

export interface DepositDto {
  id: string;
  amount: string;
  address: string;
  txHash: string;
  confirmations: number;
  confirmed: boolean;
  createdAt: string;
}

export interface WithdrawalDto {
  id: string;
  amount: string;
  address: string;
  status: string;
  txHash: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}
