// Shared between server (lib/yfinance.ts) and client chart components.
// Kept dependency-free so client components can import it without pulling
// in yahoo-finance2 (which uses Node built-ins and can't be bundled for the browser).
export const PRICE_RANGES = ["1D", "1W", "1M", "6M", "1Y", "3Y", "5Y", "10Y", "MAX"] as const;
export type PriceRange = (typeof PRICE_RANGES)[number];
