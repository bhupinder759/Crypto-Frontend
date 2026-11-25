/**
 * Number of decimals implied by an increment such as "0.01" or "1e-8".
 * Returns `fallback` when the increment is missing or invalid.
 */
export function decimalsFromIncrement(
  increment: string | number | null | undefined,
  fallback = 2,
): number {
  if (increment == null || increment === "") return fallback;
  const value = Number(increment);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  if (value >= 1) return 0;

  const text = String(increment).toLowerCase();
  const exp = text.match(/e-(\d+)$/);
  if (exp) {
    const mantissaDecimals = (text.split("e")[0]?.split(".")[1] ?? "").length;
    return Math.min(12, Number(exp[1]) + mantissaDecimals);
  }

  const decimals = (text.split(".")[1] ?? "").replace(/0+$/, "").length;
  return Math.min(12, decimals || fallback);
}

/** Sensible precision from a price's magnitude when no instrument is known. */
export function decimalsFromPrice(price: number | null | undefined): number {
  if (price == null || !Number.isFinite(price) || price === 0) return 2;
  const abs = Math.abs(price);
  if (abs >= 1_000) return 2;
  if (abs >= 1) return 4;
  if (abs >= 0.01) return 6;
  return 8;
}

export function formatFixed(
  value: string | number | null | undefined,
  decimals: number,
): string {
  if (value == null || value === "") return "--";
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

function toScaled(value: string, decimals: number): bigint | null {
  const match = value.trim().match(/^(\d*)(?:\.(\d*))?$/);
  if (!match) return null;
  const int = match[1] || "0";
  const frac = (match[2] ?? "").padEnd(decimals, "0");
  if (frac.length > decimals && /[1-9]/.test(frac.slice(decimals))) return null;
  return BigInt(int + frac.slice(0, decimals));
}

/** Exact decimal check that `value` is a positive multiple of `increment`. */
export function isMultipleOf(value: string, increment: string): boolean {
  const decimals = Math.max(
    (value.split(".")[1] ?? "").length,
    (increment.split(".")[1] ?? "").length,
  );
  const v = toScaled(value, decimals);
  const inc = toScaled(increment, decimals);
  if (v == null || inc == null || inc === BigInt(0)) return false;
  return v > BigInt(0) && v % inc === BigInt(0);
}
