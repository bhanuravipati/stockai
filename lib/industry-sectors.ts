/**
 * Hardcoded sector taxonomy for the Industry tool — Yahoo has no endpoint
 * that lists all sectors/industries, so this is a fixed allowlist matching
 * Yahoo's standard (GICS-like) sector strings. `yahooSector` must match
 * `summaryProfile.sector` / the screener's exact-match `sector` field
 * verbatim — a wrong string silently returns zero results, not an error.
 */

export interface IndustrySector {
  key: string;
  label: string;
  yahooSector: string;
}

export const INDUSTRY_SECTORS: IndustrySector[] = [
  { key: "technology", label: "Technology", yahooSector: "Technology" },
  { key: "financial-services", label: "Financial Services", yahooSector: "Financial Services" },
  { key: "energy", label: "Energy", yahooSector: "Energy" },
  { key: "healthcare", label: "Healthcare", yahooSector: "Healthcare" },
  { key: "consumer-cyclical", label: "Consumer Cyclical", yahooSector: "Consumer Cyclical" },
  { key: "consumer-defensive", label: "Consumer Defensive", yahooSector: "Consumer Defensive" },
  { key: "industrials", label: "Industrials", yahooSector: "Industrials" },
  { key: "basic-materials", label: "Basic Materials", yahooSector: "Basic Materials" },
  { key: "real-estate", label: "Real Estate", yahooSector: "Real Estate" },
  { key: "utilities", label: "Utilities", yahooSector: "Utilities" },
  { key: "communication-services", label: "Communication Services", yahooSector: "Communication Services" },
];

export function getIndustrySector(key: string): IndustrySector | undefined {
  return INDUSTRY_SECTORS.find((s) => s.key === key);
}
