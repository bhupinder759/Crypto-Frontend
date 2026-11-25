import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTicketStore } from "@/modules/trading/store/ticket.store";
import { useTradingStore } from "@/modules/trading/store/trading.store";
import { OrderBook } from "./order-book";

// The REST snapshot is irrelevant here: the live store book takes precedence.
vi.mock("@/modules/market/services/market.api", () => ({
  getOrderBook: vi.fn(() => new Promise(() => {})),
}));

const instrument = {
  symbol: "BTC-USD",
  baseAsset: "BTC",
  quoteAsset: "USD",
  minQuantity: "0.0001",
  quantityIncrement: "0.0001",
  priceIncrement: "0.01",
  supportedOrderTypes: ["LIMIT", "MARKET"] as Array<"LIMIT" | "MARKET">,
  allowMarketBuy: true,
};

function renderBook() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OrderBook symbol="BTC-USD" instrument={instrument} />
    </QueryClientProvider>,
  );
}

describe("OrderBook", () => {
  beforeEach(() => {
    useTradingStore.setState({ realtimeBySymbol: {} });
    useTicketStore.setState({ pickedPrice: null });
  });

  it("shows an empty state without liquidity", () => {
    renderBook();
    expect(screen.getByText("No liquidity yet")).toBeInTheDocument();
  });

  it("renders asks, spread and bids, and click fills the ticket price", async () => {
    renderBook();
    act(() => {
      useTradingStore.getState().setExternalOrderBook("BTC-USD", {
        symbol: "BTC-USD",
        bids: [["100.00", "1"], ["99.50", "2"]],
        asks: [["101.00", "0.5"]],
        timestamp: 1,
      });
    });

    expect(screen.getByText("101.00")).toBeInTheDocument();
    expect(screen.getByText("99.50")).toBeInTheDocument();
    expect(screen.getByText(/Spread 1\.00/)).toBeInTheDocument();
    expect(screen.getByText("100.500")).toBeInTheDocument(); // mid

    await userEvent.click(screen.getByText("99.50"));
    expect(useTicketStore.getState().pickedPrice?.price).toBe("99.50");
  });
});
