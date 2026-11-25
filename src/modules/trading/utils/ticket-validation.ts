import { isMultipleOf } from "@/lib/utils/precision";

export type TicketRules = {
  minQuantity: string;
  quantityIncrement: string;
  priceIncrement: string;
  baseAsset: string;
};

/** Validates the ticket's base quantity and (for limit orders) price against instrument rules. */
export function validateTicket(input: {
  quantity: string;
  price: string;
  type: "LIMIT" | "MARKET";
  rules: TicketRules | null;
}): { amountError: string | null; priceError: string | null } {
  const { quantity, price, type, rules } = input;
  let amountError: string | null = null;
  let priceError: string | null = null;
  if (!rules) return { amountError, priceError };

  if (quantity !== "") {
    if (!quantity || !(Number(quantity) > 0)) amountError = "Amount too small";
    else if (Number(quantity) < Number(rules.minQuantity))
      amountError = `Min ${rules.minQuantity} ${rules.baseAsset}`;
    else if (!isMultipleOf(quantity, rules.quantityIncrement))
      amountError = `Step ${rules.quantityIncrement} ${rules.baseAsset}`;
  }
  if (type === "LIMIT" && price !== "") {
    if (!(Number(price) > 0)) priceError = "Enter a price";
    else if (!isMultipleOf(price, rules.priceIncrement))
      priceError = `Tick ${rules.priceIncrement}`;
  }
  return { amountError, priceError };
}
