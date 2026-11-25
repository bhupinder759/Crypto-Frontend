export interface OrderFormInput {
  accountId: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  quantity: string;
  price?: string;
  clientOrderId: string;
}

export interface OrderDto {
  id: string;
  accountId: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  price: string | null;
  quantity: string;
  filled: string;
  remaining: string;
  status: string;
  clientOrderId: string;
}
