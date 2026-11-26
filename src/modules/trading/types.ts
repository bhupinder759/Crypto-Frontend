export type TimeInForce = "GTC" | "IOC" | "FOK";

export interface OrderFormInput {
  accountId: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  /** Base quantity. Omitted for MARKET BUY by quote amount. */
  quantity?: string;
  /** MARKET BUY only: quote amount to spend (REAL accounts). */
  quoteOrderQty?: string;
  price?: string;
  timeInForce?: TimeInForce;
  postOnly?: boolean;
  clientOrderId: string;
}

export interface CreateOrderResponse {
  message: string;
  orderId: string;
  /** REAL accounts only; DEMO returns just `orderId`. */
  status?: string;
  filled?: string;
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
  timeInForce?: TimeInForce;
  postOnly?: boolean;
  averagePrice?: string | null;
  statusReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FillDto {
  tradeId: string;
  orderId: string;
  symbol: string;
  side: "BUY" | "SELL";
  liquidity: "MAKER" | "TAKER";
  price: string;
  quantity: string;
  quoteQuantity: string;
  fee: string;
  feeAsset: string;
  timestamp: string;
}

export interface FeeScheduleDto {
  accountId: string;
  makerFeeBps: number;
  takerFeeBps: number;
  feeAsset: string;
}
