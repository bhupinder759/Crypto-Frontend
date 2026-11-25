export const ORDER_SIDES = ["BUY", "SELL"] as const;
export const ORDER_TYPES = ["LIMIT", "MARKET"] as const;

/**
 * Display-only fee estimate until the backend exposes a fee schedule.
 * Shown as "est." in the ticket.
 */
export const ESTIMATED_TAKER_FEE_RATE = 0.001;
export const ESTIMATED_MAKER_FEE_RATE = 0.001;

/**
 * The create-order API does not accept timeInForce/postOnly yet (the engine
 * supports them internally). Flip when the DTO exposes them.
 */
export const SUPPORTS_TIME_IN_FORCE = false;
