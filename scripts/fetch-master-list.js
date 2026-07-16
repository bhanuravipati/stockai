/**
 * Fetch NSE/BSE company master list and save as JSON.
 * NSE data from: https://www.nseindia.com/content/indices/ind_nifty500list.csv
 * For simplicity, start with a curated list of major NSE symbols.
 * In production, fetch the full CSV from NSE official API.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Curated list of major NSE/BSE companies for Phase 1.
// In Phase 2, expand to full NSE equity list (~6000 companies).
const NSE_BSE_COMPANIES = [
  // Banking
  { symbol: "HDFCBANK", name: "HDFC Bank Limited", sector: "Financial Services", exchange: "NSE" },
  { symbol: "ICICIBANK", name: "ICICI Bank Limited", sector: "Financial Services", exchange: "NSE" },
  { symbol: "SBIN", name: "State Bank of India", sector: "Financial Services", exchange: "NSE" },
  { symbol: "AXISBANK", name: "Axis Bank Limited", sector: "Financial Services", exchange: "NSE" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Limited", sector: "Financial Services", exchange: "NSE" },

  // IT & Tech
  { symbol: "TCS", name: "Tata Consultancy Services Limited", sector: "Information Technology", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys Limited", sector: "Information Technology", exchange: "NSE" },
  { symbol: "WIPRO", name: "Wipro Limited", sector: "Information Technology", exchange: "NSE" },
  { symbol: "TECHM", name: "Tech Mahindra Limited", sector: "Information Technology", exchange: "NSE" },

  // Conglomerates & Industrial
  { symbol: "RELIANCE", name: "Reliance Industries Limited", sector: "Energy", exchange: "NSE" },
  { symbol: "LT", name: "Larsen & Toubro Limited", sector: "Infrastructure & Construction", exchange: "NSE" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Limited", sector: "Telecommunications", exchange: "NSE" },

  // FMCG & Consumer
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Limited", sector: "Consumer Goods", exchange: "NSE" },
  { symbol: "ITC", name: "ITC Limited", sector: "Consumer Goods", exchange: "NSE" },
  { symbol: "ASIANPAINT", name: "Asian Paints (India) Limited", sector: "Consumer Goods", exchange: "NSE" },
  { symbol: "MARUTI", name: "Maruti Suzuki India Limited", sector: "Automobiles", exchange: "NSE" },

  // Financial Services
  { symbol: "BAJFINANCE", name: "Bajaj Finance Limited", sector: "Financial Services", exchange: "NSE" },
];

async function fetchMasterList() {
  try {
    const outputPath = path.join(__dirname, "../data/company-master.json");

    // Ensure data directory exists
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save the curated list
    fs.writeFileSync(outputPath, JSON.stringify(NSE_BSE_COMPANIES, null, 2));
    console.log(`✓ Master list saved to ${outputPath}`);
    console.log(`  ${NSE_BSE_COMPANIES.length} companies loaded`);

    return NSE_BSE_COMPANIES;
  } catch (error) {
    console.error("Error fetching master list:", error);
    process.exit(1);
  }
}

// Run if called directly
fetchMasterList().then(() => {
  console.log("\nTip: To expand to full NSE equity list in Phase 2, download:");
  console.log("  https://www.nseindia.com/content/indices/ind_nifty500list.csv");
  console.log("  and merge with this seed list, deduplicating by symbol.");
});

export { NSE_BSE_COMPANIES, fetchMasterList };
