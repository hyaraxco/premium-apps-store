import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

/**
 * Default client for Server Components & simple queries.
 * - Neon → neon-http
 * - Local/other Postgres → node-postgres Pool
 * Multi-statement transactions → `./tx` withTransaction
 */

function isNeonUrl(url: string): boolean {
  return /neon\.tech/i.test(url) || /neon\.database/i.test(url);
}

function createDb() {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    const sql = neon(
      "postgresql://dummy:dummy@ep-dummy-123456.us-east-1.aws.neon.tech/neondb?sslmode=require",
    );
    return drizzleHttp(sql, { schema });
  }

  if (isNeonUrl(connectionString)) {
    return drizzleHttp(neon(connectionString), { schema });
  }

  const pool = new pg.Pool({ connectionString });
  return drizzlePg(pool, { schema });
}

export const db = createDb();
export type AppDb = typeof db;
