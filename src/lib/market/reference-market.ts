import type {
  InstrumentDto,
  OrderBookDto,
  TickerDto,
  TradeDto,
} from "@/types/api.types";

const FRANKFURTER_BASE_URL = "https://api.frankfurter.dev/v2";

const SYNTHETIC_CRYPTO_BASE: Record<string, number> = {
  "BTC-USD": 84250,
  "ETH-USD": 1925,
  "SOL-USD": 138,
  "XRP-USD": 0.62,
  "BNB-USD": 612,
  "ADA-USD": 0.74,
  "DOGE-USD": 0.18,
};

const CRYPTO_SYMBOL_MAP: Record<string, string> = {
  "BTC-USD": "BTCUSDT",
  "ETH-USD": "ETHUSDT",
  "SOL-USD": "SOLUSDT",
  "XRP-USD": "XRPUSDT",
  "BNB-USD": "BNBUSDT",
  "ADA-USD": "ADAUSDT",
  "DOGE-USD": "DOGEUSDT",
};

const FOREX_SYMBOLS = [
  "EUR-USD",
  "GBP-USD",
  "USD-JPY",
  "AUD-USD",
  "USD-CAD",
  "USD-CHF",
] as const;

export const REFERENCE_SYMBOLS = [
  ...Object.keys(CRYPTO_SYMBOL_MAP),
  ...FOREX_SYMBOLS,
];

type FrankfurterRateResponse = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

function getAssetPair(symbol: string) {
  const [baseAsset, quoteAsset] = symbol.split("-");
  return { baseAsset, quoteAsset };
}

function isCryptoSymbol(symbol: string) {
  return symbol in CRYPTO_SYMBOL_MAP;
}

function isForexSymbol(symbol: string) {
  return FOREX_SYMBOLS.includes(symbol as (typeof FOREX_SYMBOLS)[number]);
}

function buildReferenceInstrument(symbol: string): InstrumentDto {
  const { baseAsset, quoteAsset } = getAssetPair(symbol);

  return {
    symbol,
    baseAsset,
    quoteAsset,
    minQuantity: isForexSymbol(symbol) ? "1000" : "1",
    quantityIncrement: isForexSymbol(symbol) ? "1000" : "1",
    priceIncrement: "1",
    supportedOrderTypes: ["LIMIT", "MARKET"],
    allowMarketBuy: false,
  };
}

function decimalsForSymbol(symbol: string) {
  const base = SYNTHETIC_CRYPTO_BASE[symbol] ?? 1;
  if (base >= 1000) return 2;
  if (base >= 1) return 4;
  return 6;
}

function formatPrice(symbol: string, value: number) {
  return value.toFixed(decimalsForSymbol(symbol));
}

function formatQuantity(symbol: string, value: number) {
  return value.toFixed(symbol === "BTC-USD" ? 4 : 2);
}

function syntheticPriceAt(symbol: string, timestampMs: number) {
  const base = SYNTHETIC_CRYPTO_BASE[symbol] ?? 100;
  const fast = Math.sin(timestampMs / 180_000);
  const slow = Math.cos(timestampMs / 3_600_000);
  const drift = Math.sin(timestampMs / 86_400_000);
  const factor = 1 + fast * 0.0025 + slow * 0.006 + drift * 0.018;
  return base * factor;
}

function getSyntheticCryptoTicker(symbol: string): TickerDto {
  const now = Date.now();
  const lastPrice = syntheticPriceAt(symbol, now);
  const earlier = syntheticPriceAt(symbol, now - 24 * 60 * 60_000);
  const priceChange = lastPrice - earlier;

  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  let volume = 0;

  for (let hour = 0; hour < 24; hour += 1) {
    const price = syntheticPriceAt(symbol, now - hour * 60 * 60_000);
    low = Math.min(low, price);
    high = Math.max(high, price);
    volume += (hour + 1) * 12;
  }

  return {
    symbol,
    lastPrice: formatPrice(symbol, lastPrice),
    high24h: formatPrice(symbol, high),
    low24h: formatPrice(symbol, low),
    volume24h: String(Math.round(volume)),
    priceChange24h: formatPrice(symbol, priceChange),
  };
}

function getSyntheticCryptoTrades(symbol: string, limit = 50): TradeDto[] {
  const now = Date.now();

  return Array.from({ length: limit }, (_, index) => {
    const timestamp = now - index * 12_000;
    const price = syntheticPriceAt(symbol, timestamp);
    const quantity = 0.1 + (index % 7) * 0.03;

    return {
      id: `${symbol}-synthetic-trade-${timestamp}`,
      symbol,
      price: formatPrice(symbol, price),
      quantity: formatQuantity(symbol, quantity),
      buyOrderId: `buy-${index}`,
      sellOrderId: `sell-${index}`,
      timestamp: new Date(timestamp).toISOString(),
    };
  });
}

function getSyntheticCryptoOrderBook(symbol: string): OrderBookDto {
  const mid = syntheticPriceAt(symbol, Date.now());
  const step = Math.max(mid * 0.0008, 0.01);
  const bids: [string, string][] = [];
  const asks: [string, string][] = [];

  for (let level = 1; level <= 12; level += 1) {
    bids.push([
      formatPrice(symbol, mid - step * level),
      formatQuantity(symbol, 0.5 + level * 0.12),
    ]);
    asks.push([
      formatPrice(symbol, mid + step * level),
      formatQuantity(symbol, 0.45 + level * 0.11),
    ]);
  }

  return {
    symbol,
    bids,
    asks,
    timestamp: Date.now(),
  };
}

export function getSyntheticRealtimeSnapshot(symbol: string): {
  ticker: TickerDto;
  orderBook: OrderBookDto;
  trades: TradeDto[];
} | null {
  if (!isCryptoSymbol(symbol)) {
    return null;
  }

  return {
    ticker: getSyntheticCryptoTicker(symbol),
    orderBook: getSyntheticCryptoOrderBook(symbol),
    trades: getSyntheticCryptoTrades(symbol, 20),
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    next: { revalidate: 15 },
  });

  if (!response.ok) {
    throw new Error(`Reference market request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getReferenceSymbols() {
  return REFERENCE_SYMBOLS;
}

export function getReferenceInstrument(symbol: string) {
  return REFERENCE_SYMBOLS.includes(symbol) ? buildReferenceInstrument(symbol) : null;
}

export function getReferenceInstruments() {
  return REFERENCE_SYMBOLS.map(buildReferenceInstrument);
}

export function getReferenceStreamSymbol(symbol: string) {
  return CRYPTO_SYMBOL_MAP[symbol]?.toLowerCase() ?? null;
}

export function isReferenceCryptoSymbol(symbol: string) {
  return isCryptoSymbol(symbol);
}

export async function getReferenceTicker(symbol: string): Promise<TickerDto | null> {
  if (isCryptoSymbol(symbol)) {
    return getSyntheticCryptoTicker(symbol);
  }

  if (isForexSymbol(symbol)) {
    const { baseAsset, quoteAsset } = getAssetPair(symbol);
    const payload = await fetchJson<FrankfurterRateResponse>(
      `${FRANKFURTER_BASE_URL}/rate/${baseAsset}/${quoteAsset}`,
    );

    return {
      symbol,
      lastPrice: String(payload.rate),
      high24h: String(payload.rate),
      low24h: String(payload.rate),
      volume24h: "0",
      priceChange24h: "0",
    };
  }

  return null;
}

export async function getReferenceTrades(
  symbol: string,
  limit = 50,
): Promise<TradeDto[]> {
  if (isCryptoSymbol(symbol)) {
    return getSyntheticCryptoTrades(symbol, limit);
  }

  if (!isCryptoSymbol(symbol)) {
    return [];
  }

  return [];
}

export async function getReferenceOrderBook(
  symbol: string,
): Promise<OrderBookDto | null> {
  if (isCryptoSymbol(symbol)) {
    return getSyntheticCryptoOrderBook(symbol);
  }

  if (!isCryptoSymbol(symbol)) {
    return null;
  }

  return null;
}
