/**
 * Smoke interactive transaction against Neon.
 * Requires DATABASE_URL in .env.local
 *
 *   npm exec tsx -- scripts/tx-smoke.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || url.includes("USER:PASSWORD") || url.includes("ep-sample") || url.includes("ep-XXXX")) {
    console.log(`
SKIP: real DATABASE_URL not set in .env.local

Get URI from https://console.neon.tech → Connection string
Then:

  # edit .env.local
  DATABASE_URL=postgresql://...@ep-....neon.tech/neondb?sslmode=require

  npm run db:migrate
  npm run db:seed
  npm run check:tx
`);
    process.exit(0);
  }

  const { withTransaction } = await import("../src/db/tx");
  const schema = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/db/index");

  const marker = `tx-smoke-${Date.now()}`;

  await withTransaction(async (tx) => {
    await tx.insert(schema.adminSettings).values({
      key: marker,
      value: "1",
      updatedAt: new Date(),
    });
    const rows = await tx
      .select()
      .from(schema.adminSettings)
      .where(eq(schema.adminSettings.key, marker));
    if (rows.length !== 1) throw new Error("insert not visible in tx");
    throw new Error("ROLLBACK_INTENTIONAL");
  }).catch((e: Error) => {
    if (e.message !== "ROLLBACK_INTENTIONAL") throw e;
  });

  const left = await db
    .select()
    .from(schema.adminSettings)
    .where(eq(schema.adminSettings.key, marker));
  if (left.length !== 0) {
    throw new Error("ROLLBACK failed — row still present");
  }

  console.log("tx-smoke OK: interactive transaction commit/rollback works");
}

main().catch((e) => {
  console.error("tx-smoke FAILED:", e);
  process.exit(1);
});
