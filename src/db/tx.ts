import "server-only";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Node.js needs ws for Neon WebSocket Pool (interactive transactions)
neonConfig.webSocketConstructor = ws;

export type TxDb = ReturnType<typeof drizzle<typeof schema>>;

let pool: Pool | null = null;

function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for transactional writes");
  }
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

/** Transaction-capable Drizzle client (Neon WebSocket Pool). */
export function getTxDb(): TxDb {
  return drizzle(getPool(), { schema });
}

/**
 * Run work inside one interactive transaction.
 * Use for checkout reserve, expire release, fulfillment writes.
 */
export async function withTransaction<T>(
  fn: (tx: Parameters<Parameters<TxDb["transaction"]>[0]>[0]) => Promise<T>,
): Promise<T> {
  const db = getTxDb();
  return db.transaction(async (tx) => fn(tx));
}
