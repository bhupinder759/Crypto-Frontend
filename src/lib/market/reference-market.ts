import type {
  CandleDto,
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

export const REFERENCE_INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;

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

function intervalToMs(interval: string) {
  switch (interval) {
    case "1m":
      return 60_000;
    case "5m":
      return 5 * 60_000;
    case "15m":
      return 15 * 60_000;
    case "1h":
      return 60 * 60_000;
    case "4h":
      return 4 * 60 * 60_000;
    case "1d":
      return 24 * 60 * 60_000;
    default:
      return 60_000;
  }
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

function getSyntheticCryptoCandles(
  symbol: string,
  interval = "1m",
  limit = 60,
): CandleDto[] {
  const step = intervalToMs(interval);
  const now = Date.now();

  return Array.from({ length: limit }, (_, index) => {
    const openTimeMs = now - (limit - index) * step;
    const closeTimeMs = openTimeMs + step - 1;
    const open = syntheticPriceAt(symbol, openTimeMs);
    const close = syntheticPriceAt(symbol, closeTimeMs);
    const high = Math.max(open, close) * 1.0018;
    const low = Math.min(open, close) * 0.9982;
    const volume = 25 + ((index % 9) + 1) * 3;

    return {
      id: `${symbol}-${interval}-${openTimeMs}`,
      symbol,
      interval,
      open: formatPrice(symbol, open),
      high: formatPrice(symbol, high),
      low: formatPrice(symbol, low),
      close: formatPrice(symbol, close),
      volume: String(volume),
      openTime: new Date(openTimeMs).toISOString(),
      closeTime: new Date(closeTimeMs).toISOString(),
    };
  });
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

export async function getReferenceCandles(
  symbol: string,
  interval = "1m",
  limit = 60,
): Promise<CandleDto[]> {
  if (isCryptoSymbol(symbol)) {
    return getSyntheticCryptoCandles(symbol, interval, limit);
  }

  if (isForexSymbol(symbol)) {
    const { baseAsset, quoteAsset } = getAssetPair(symbol);
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - Math.max(limit * 2, 30));

    const payload = await fetchJson<FrankfurterRateResponse[]>(
      `${FRANKFURTER_BASE_URL}/rates?base=${baseAsset}&quotes=${quoteAsset}&from=${from.toISOString().slice(0, 10)}&to=${to.toISOString().slice(0, 10)}`,
    );

    const sorted = payload
      .slice()
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(-limit);

    return sorted.map((entry, index) => {
      const previousRate = sorted[index - 1]?.rate ?? entry.rate;
      const high = Math.max(previousRate, entry.rate);
      const low = Math.min(previousRate, entry.rate);
      const openTime = `${entry.date}T00:00:00.000Z`;
      const closeTime = `${entry.date}T23:59:59.999Z`;

      return {
        id: `${symbol}-${entry.date}`,
        symbol,
        interval: "1d",
        open: String(previousRate),
        high: String(high),
        low: String(low),
        close: String(entry.rate),
        volume: "0",
        openTime,
        closeTime,
      };
    });
  }

  return [];
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
