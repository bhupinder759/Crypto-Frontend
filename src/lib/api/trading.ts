import axios from "axios";

export interface OrderRequest {
  accountId: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  quantity: string;
  price?: string;
}

export interface PositionRequest {
  accountId: string;
  symbol: string;
  quantity: string;
  entryPrice: string;
  leverage?: number;
}

export const tradingApi = {
  // Accounts
  getUserAccounts: (userId: string) =>
    axios.get(`/api/trading/accounts?userId=${userId}`),

  getAccount: (accountId: string) =>
    axios.get(`/api/trading/accounts/${accountId}`),

  createAccount: (
    userId: string,
    accountType: "DEMO" | "REAL",
    accountName: string,
    balance?: string
  ) =>
    axios.post("/api/trading/accounts", {
      userId,
      accountType,
      accountName,
      balance,
    }),

  getAccountStats: (accountId: string) =>
    axios.get(`/api/trading/accounts/${accountId}/stats`),

  // Positions
  openPosition: (data: PositionRequest) =>
    axios.post("/api/trading/positions", data),

  updatePositionPnL: (positionId: string, currentPrice: string) =>
    axios.post(`/api/trading/positions/${positionId}/update-pnl`, {
      currentPrice,
    }),

  // Orders
  createOrder: (data: OrderRequest) =>
    axios.post("/api/trading/orders", data),

  executeOrder: (orderId: string, executionPrice: string) =>
    axios.post(`/api/trading/orders/${orderId}/execute`, { executionPrice }),
};
