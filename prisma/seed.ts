import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Load company master list from JSON file
  const masterListPath = path.join(__dirname, "../data/company-master.json");
  const masterList = JSON.parse(fs.readFileSync(masterListPath, "utf-8"));

  console.log(`Seeding ${masterList.length} companies from master list...`);

  let created = 0;
  let updated = 0;

  for (const company of masterList) {
    const existing = await prisma.company.findUnique({
      where: { symbol: company.symbol },
      select: { symbol: true },
    });

    await prisma.company.upsert({
      where: { symbol: company.symbol },
      update: {
        name: company.name,
        sector: company.sector,
        exchange: company.exchange,
      },
      create: {
        symbol: company.symbol,
        name: company.name,
        sector: company.sector,
        exchange: company.exchange,
      },
    });

    if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  console.log(`✓ Master list seeded: ${created} created, ${updated} updated (${created + updated} total) in Postgres`);
  console.log("\nNote: All financial data is now fetched live from yfinance API.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
