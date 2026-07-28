import * as schema from "./schema";

/**
 * Transaction client:
 * - Neon (*.neon.tech): WebSocket Pool + drizzle-orm/neon-serverless
 * - Local/other Postgres: node-postgres Pool + drizzle-orm/node-postgres
 *
 * Context7: interactive transactions need a real session Pool, not neon-http.
 */

function isNeonUrl(url: string): boolean {
  return /neon\.tech/i.test(url) || /neon\.database/i.test(url);
}

export type AnyTx = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: (fn: (tx: any) => Promise<unknown>) => Promise<unknown>;
};

let cached: { url: string; db: AnyTx } | null = null;

async function createTxDb(url: string): Promise<AnyTx> {
  if (isNeonUrl(url)) {
    const { Pool, neonConfig } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-serverless");
    const ws = (await import("ws")).default;
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: url });
    return drizzle(pool, { schema }) as unknown as AnyTx;
  }

  const { default: pg } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const pool = new pg.Pool({ connectionString: url });
  return drizzle(pool, { schema }) as unknown as AnyTx;
}

async function getTxDb(): Promise<AnyTx> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required for transactional writes");
  }
  if (cached?.url === url) return cached.db;
  const db = await createTxDb(url);
  cached = { url, db };
  return db;
}

/**
 * Run work inside one interactive transaction.
 * Use for checkout reserve, expire release, fulfillment writes.
 */
export async function withTransaction<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (tx: any) => Promise<T>,
): Promise<T> {
  const db = await getTxDb();
  return db.transaction(async (tx) => fn(tx)) as Promise<T>;
}
