import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * HTTP client — independent SELECTs / single statements.
 * Do NOT use for multi-statement interactive transactions.
 */
function createHttpDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Build-time / no-DB: dummy URL so module loads; queries must guard DATABASE_URL
    const sql = neon(
      "postgresql://dummy:dummy@ep-dummy-123456.us-east-1.aws.neon.tech/neondb?sslmode=require",
    );
    return drizzleHttp(sql, { schema });
  }
  return drizzleHttp(neon(connectionString), { schema });
}

export const db = createHttpDb();
export type HttpDb = typeof db;
