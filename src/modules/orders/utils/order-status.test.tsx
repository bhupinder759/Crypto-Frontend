import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderStatusBadge, isOpenOrder } from "./order-status";

describe("isOpenOrder", () => {
  it("treats resting statuses as open", () => {
    for (const status of ["NEW", "PARTIAL_FILL", "partially_filled", "PENDING"]) {
      expect(isOpenOrder({ status })).toBe(true);
    }
    for (const status of ["FILLED", "CANCELLED", "REJECTED"]) {
      expect(isOpenOrder({ status })).toBe(false);
    }
  });
});

describe("OrderStatusBadge", () => {
  it("renders a readable label with a status color", () => {
    render(<OrderStatusBadge status="PARTIAL_FILL" />);
    const badge = screen.getByText("PARTIAL FILL");
    expect(badge.className).toContain("text-warning");
  });

  it("uses success for filled and danger for rejected", () => {
    render(
      <>
        <OrderStatusBadge status="FILLED" />
        <OrderStatusBadge status="REJECTED" />
      </>,
    );
    expect(screen.getByText("FILLED").className).toContain("text-buy");
    expect(screen.getByText("REJECTED").className).toContain("text-sell");
  });
});
