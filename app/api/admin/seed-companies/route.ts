import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import companyMaster from "@/data/company-master.json";

/**
 * POST /api/admin/seed-companies
 * Populates the Company table with seed data.
 * This is a temporary endpoint for initial setup only. Set ADMIN_SEED_SECRET
 * and pass it as the `x-admin-secret` header to require auth before deploying
 * publicly — left open when the env var is unset so local dev is unaffected.
 */
export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SEED_SECRET;
  if (adminSecret && request.headers.get("x-admin-secret") !== adminSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[seed-companies] Starting seed...");

    let created = 0;
    let updated = 0;

    for (const company of companyMaster) {
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

    console.log(`[seed-companies] ✓ ${created} created, ${updated} updated`);

    return NextResponse.json({
      ok: true,
      message: `Seeded ${created} created, ${updated} updated from master list`,
      created,
      updated,
    });
  } catch (error) {
    console.error("[seed-companies] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
