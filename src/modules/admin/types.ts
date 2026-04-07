export interface AdminOverviewDto {
  users: number;
  admins: number;
  accounts: number;
  orders: number;
  openOrders: number;
  pendingWithdrawals: number;
  pendingOutbox: number;
  trades24h: number;
  deposits24h: number;
  activeSymbols: number;
  volume24hQuote: string;
}

export interface AdminUserDto {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  lastSessionAt: string | null;
}

export interface AdminPendingWithdrawalDto {
  id: string;
  userId: string;
  amount: string;
  address: string;
  status: string;
  txHash: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}
