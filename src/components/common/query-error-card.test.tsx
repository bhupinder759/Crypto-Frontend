import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QueryErrorCard } from "./query-error-card";

describe("QueryErrorCard", () => {
  it("shows the error message and retries", async () => {
    const onRetry = vi.fn();
    render(<QueryErrorCard title="Couldn't load orders" error={new Error("Backend down")} onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't load orders");
    expect(screen.getByText("Backend down")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("disables retry while retrying and hides it without a handler", () => {
    const { rerender } = render(<QueryErrorCard onRetry={() => {}} retrying />);
    expect(screen.getByRole("button", { name: /retrying/i })).toBeDisabled();
    rerender(<QueryErrorCard />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
