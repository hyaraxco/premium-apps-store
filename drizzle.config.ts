import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

const url = process.env.DATABASE_URL?.trim() || "";
if (!url || url.includes("ep-sample") || url.includes("user:password")) {
  console.error(`
[drizzle] DATABASE_URL missing or still a placeholder.

1. Create Neon project: https://console.neon.tech
2. Copy connection string (postgresql://...@ep-....neon.tech/neondb?sslmode=require)
3. Put it in ${envPath}:

   DATABASE_URL=postgresql://...

4. Re-run: npm run db:migrate && npm run db:seed && npm run check:tx
`);
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
