/**
 * Generate a bcrypt hash of the admin password for ADMIN_PASSWORD.
 *
 * bcrypt truncates at 72 bytes, so the password is pre-hashed with SHA-256
 * (hex, 64 chars) before bcrypt — this preserves the full entropy of long
 * passwords and matches the pre-hash login side in checkPasswordAgainst
 * (src/lib/admin-auth.ts).
 *
 * Usage:
 *   npm run hash:admin-password                # reads ADMIN_PASSWORD from .env.local
 *   ADMIN_PASSWORD='secret' npm run hash:admin-password   # explicit value
 *
 * Output:
 *   1. RAW hash — paste into the Vercel dashboard (production env var).
 *   2. ESCAPED hash — paste into .env.local. Next's env loader interpolates
 *      "$VAR"-like tokens, so every "$" must be escaped as "\$" in env files;
 *      the loader restores it at startup. The script proves the round-trip
 *      through Next's own loader (@next/env) before printing.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createHash } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;

function sha256hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

/** Verify the escaped form round-trips to the raw hash through Next's loader. */
async function assertEscapeRoundTrip(escaped: string, raw: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hash-pw-"));
  try {
    fs.writeFileSync(path.join(dir, ".env"), `ADMIN_PASSWORD="${escaped}"\n`);
    // Scrub any pre-loaded value so @next/env parses the temp file's value.
    delete process.env.ADMIN_PASSWORD;
    const { loadEnvConfig } = await import("@next/env");
    const { combinedEnv } = loadEnvConfig(dir, false);
    if (combinedEnv.ADMIN_PASSWORD !== raw) {
      throw new Error(
        `escape round-trip failed: got len ${combinedEnv.ADMIN_PASSWORD?.length ?? 0}, expected ${raw.length}`,
      );
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    delete process.env.ADMIN_PASSWORD;
  }
}

async function main() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error("ERROR: ADMIN_PASSWORD not set (in .env.local or environment).");
    process.exit(1);
  }

  const raw = bcrypt.hashSync(sha256hex(password), BCRYPT_ROUNDS);

  if (raw.length !== 60 || !raw.startsWith("$2")) {
    throw new Error("Unexpected bcrypt hash format");
  }
  if (!bcrypt.compareSync(sha256hex(password), raw)) {
    throw new Error("Self-verify failed: hash does not validate");
  }

  const escaped = raw.replace(/\$/g, "\\$");
  await assertEscapeRoundTrip(escaped, raw);

  console.log("RAW hash — Vercel dashboard (ADMIN_PASSWORD env var):");
  console.log(raw);
  console.log("");
  console.log("ESCAPED hash — .env.local (every $ escaped as \\$):");
  console.log(`ADMIN_PASSWORD="${escaped}"`);
  console.log(
    `(bcrypt rounds=${BCRYPT_ROUNDS}, sha256 pre-hash. The escaped form was verified ` +
      "to survive Next's env loader unchanged.)",
  );
}

try {
  main();
} catch (e) {
  console.error("hash-password FAILED:", e);
  process.exit(1);
}
