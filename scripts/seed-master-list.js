import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

async function seedMasterList() {
  const pool = new Pool({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    // Load master list
    const masterListPath = path.join(__dirname, "../data/company-master.json");
    const companies = JSON.parse(fs.readFileSync(masterListPath, "utf-8"));

    console.log(`Seeding ${companies.length} companies...`);

    // Seed each company (use proper casing for Prisma-generated table names)
    for (const company of companies) {
      await pool.query(
        'INSERT INTO "Company" (id, symbol, name, sector, exchange, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) ON CONFLICT (symbol) DO UPDATE SET name=$2, sector=$3, exchange=$4, "updatedAt"=NOW()',
        [company.symbol, company.name, company.sector, company.exchange]
      );
    }

    console.log(`✓ Seeded ${companies.length} companies`);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedMasterList();
