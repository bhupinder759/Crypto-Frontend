export const ORDER_SIDES = ["BUY", "SELL"] as const;
export const ORDER_TYPES = ["LIMIT", "MARKET"] as const;

/** Fallback fee schedule (backend defaults) when `/accounts/fees` is unavailable. */
export const DEFAULT_MAKER_FEE_BPS = 10;
export const DEFAULT_TAKER_FEE_BPS = 20;

/** Create-order accepts timeInForce/postOnly (REAL accounts; demo ignores them). */
export const SUPPORTS_TIME_IN_FORCE = true;
