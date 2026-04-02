import type { CandleDto, OrderBookDto, TickerDto, TradeDto } from "@/types/api.types";

const BINANCE_BASE_URL = "https://api.binance.com";
const FRANKFURTER_BASE_URL = "https://api.frankfurter.dev/v2";

const CRYPTO_SYMBOL_MAP: Record<string, string> = {
  "BTC-USD": "BTCUSDT",
  "ETH-USD": "ETHUSDT",
  "SOL-USD": "SOLUSDT",
};

const FOREX_SYMBOLS = ["EUR-USD", "GBP-USD", "USD-JPY"] as const;

export const REFERENCE_SYMBOLS = [
  ...Object.keys(CRYPTO_SYMBOL_MAP),
  ...FOREX_SYMBOLS,
];

type BinanceTickerResponse = {
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  priceChange: string;
};

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

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    next: { revalidate: 15 },
  });

  if (!response.ok) {
    throw new Error(`Reference market request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function toISOString(input: string | number) {
  return new Date(input).toISOString();
}

export function getReferenceSymbols() {
  return REFERENCE_SYMBOLS;
}

export async function getReferenceTicker(symbol: string): Promise<TickerDto | null> {
  if (isCryptoSymbol(symbol)) {
    const mapped = CRYPTO_SYMBOL_MAP[symbol];
    const payload = await fetchJson<BinanceTickerResponse>(
      `${BINANCE_BASE_URL}/api/v3/ticker/24hr?symbol=${mapped}`,
    );

    return {
      symbol,
      lastPrice: payload.lastPrice,
      high24h: payload.highPrice,
      low24h: payload.lowPrice,
      volume24h: payload.volume,
      priceChange24h: payload.priceChange,
    };
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
    const mapped = CRYPTO_SYMBOL_MAP[symbol];
    const payload = await fetchJson<
      [number, string, string, string, string, string, number][]
    >(
      `${BINANCE_BASE_URL}/api/v3/klines?symbol=${mapped}&interval=${interval}&limit=${limit}`,
    );

    return payload.map((entry, index) => ({
      id: `${symbol}-${entry[0]}-${index}`,
      symbol,
      interval,
      open: entry[1],
      high: entry[2],
      low: entry[3],
      close: entry[4],
      volume: entry[5],
      openTime: toISOString(entry[0]),
      closeTime: toISOString(entry[6]),
    }));
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
  if (!isCryptoSymbol(symbol)) {
    return [];
  }

  const mapped = CRYPTO_SYMBOL_MAP[symbol];
  const payload = await fetchJson<
    Array<{ id: number; price: string; qty: string; time: number; isBuyerMaker: boolean }>
  >(`${BINANCE_BASE_URL}/api/v3/trades?symbol=${mapped}&limit=${limit}`);

  return payload.map((trade) => ({
    id: `${symbol}-${trade.id}`,
    symbol,
    price: trade.price,
    quantity: trade.qty,
    buyOrderId: trade.isBuyerMaker ? `maker-${trade.id}` : `taker-${trade.id}`,
    sellOrderId: trade.isBuyerMaker ? `taker-${trade.id}` : `maker-${trade.id}`,
    timestamp: toISOString(trade.time),
  }));
}

export async function getReferenceOrderBook(
  symbol: string,
): Promise<OrderBookDto | null> {
  if (!isCryptoSymbol(symbol)) {
    return null;
  }

  const mapped = CRYPTO_SYMBOL_MAP[symbol];
  const payload = await fetchJson<{
    lastUpdateId: number;
    bids: [string, string][];
    asks: [string, string][];
  }>(`${BINANCE_BASE_URL}/api/v3/depth?symbol=${mapped}&limit=20`);

  return {
    symbol,
    bids: payload.bids,
    asks: payload.asks,
    timestamp: Date.now(),
  };
}
