import DecimalJs from "decimal.js";

/**
 * Arbitrary-precision decimal for money (prices, quantities, balances, fees).
 * Mirrors the backend helper: no exponent notation, 40 significant digits.
 * Use this — not JS numbers — for any amount that is compared, validated or
 * sent to the API. Plain numbers are fine for charts/approximate displays.
 */
export const Decimal = DecimalJs.clone({
  precision: 40,
  rounding: DecimalJs.ROUND_HALF_EVEN,
  toExpNeg: -40,
  toExpPos: 40,
});
export type Decimal = DecimalJs;

export const ZERO = new Decimal(0);

/** Lenient parse: invalid/empty input becomes 0 (never throws). */
export function dec(value: DecimalJs.Value | null | undefined): Decimal {
  if (value === null || value === undefined || value === "") return ZERO;
  try {
    const d = new Decimal(value);
    return d.isFinite() ? d : ZERO;
  } catch {
    return ZERO;
  }
}

/** Strict check for a user-typed positive decimal string (no sign/exponent). */
export function isDecimalString(value: string, maxDecimals = 18): boolean {
  return new RegExp(`^(0|[1-9]\\d*)(\\.\\d{1,${maxDecimals}})?$`).test(value.trim());
}

function stepDecimals(step: Decimal) {
  return Math.max(0, step.decimalPlaces());
}

/** Floors `value` down to a multiple of `step`; "" when the result is ≤ 0. */
export function floorToStep(value: DecimalJs.Value, step: DecimalJs.Value): string {
  const v = dec(value);
  const s = dec(step);
  if (v.lte(0)) return "";
  if (s.lte(0)) return v.toFixed();
  const floored = v.div(s).floor().mul(s);
  return floored.gt(0) ? floored.toFixed(stepDecimals(s)) : "";
}

/** Exact "is a positive multiple of step". */
export function isStepMultiple(value: DecimalJs.Value, step: DecimalJs.Value): boolean {
  const v = dec(value);
  const s = dec(step);
  return v.gt(0) && s.gt(0) && v.mod(s).isZero();
}

/** Basis points → fraction as Decimal (20 bps → 0.002). */
export function bpsToRate(bps: number | string): Decimal {
  return dec(bps).div(10_000);
}
