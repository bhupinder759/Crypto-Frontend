import { formatNumber } from "@/lib/utils/formatter";

export function formatPrice(value: string | number) {
  return formatNumber(value, 2);
}
