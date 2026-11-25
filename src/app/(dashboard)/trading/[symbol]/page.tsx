import type { Metadata } from "next";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { backendFetch } from "@/lib/api/backend";
import { requireServerSession } from "@/lib/api/server-session";
import { routes } from "@/lib/constants/routes";
import { TradingTerminal } from "@/modules/trading/components/terminal/trading-terminal";

const SYMBOL_PATTERN = /^[A-Z0-9]{2,12}-[A-Z0-9]{2,12}$/;

function normalizeSymbol(raw: string) {
  try {
    return decodeURIComponent(raw).trim().toUpperCase();
  } catch {
    return "";
  }
}

/** Listed symbols, or null when the backend can't be reached (don't 404 then). */
async function getListedSymbols(): Promise<string[] | null> {
  try {
    const symbols = await backendFetch<string[]>("/api/v1/market/symbols");
    return Array.isArray(symbols) && symbols.length > 0 ? symbols : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  const normalized = normalizeSymbol(symbol);
  return {
    title: SYMBOL_PATTERN.test(normalized) ? normalized : "Market not found",
  };
}

export default async function TradingSymbolPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol: rawSymbol } = await params;
  const symbol = normalizeSymbol(rawSymbol);

  if (!SYMBOL_PATTERN.test(symbol)) {
    notFound();
  }

  if (symbol !== rawSymbol) {
    redirect(`${routes.trading}/${symbol}` as Route);
  }

  const [session, listed] = await Promise.all([
    requireServerSession(),
    getListedSymbols(),
  ]);

  if (listed && !listed.includes(symbol)) {
    notFound();
  }

  return <TradingTerminal symbol={symbol} account={session.account} />;
}
