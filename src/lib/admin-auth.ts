import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, lt } from "drizzle-orm";
import { randomBytes, createHash, timingSafeEqual } from "crypto";

const COOKIE_NAME = "app_store_admin_token";
// Fail closed in production: without ADMIN_PASSWORD no login can succeed.
const ADMIN_PASS =
  process.env.ADMIN_PASSWORD ||
  (process.env.NODE_ENV === "development" ? "local-admin-dev" : "");

function hashToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export async function createAdminSession(): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours

  if (process.env.DATABASE_URL) {
    try {
      // GC: purge expired sessions on each login (no cron on hobby plan).
      await db
        .delete(schema.adminSessions)
        .where(lt(schema.adminSessions.expiresAt, new Date()));
      await db.insert(schema.adminSessions).values({
        token: token.slice(0, 16), // ID portion
        tokenHash,
        expiresAt,
      });
    } catch (e) {
      console.error("Failed to create admin session:", e);
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return false;

  if (!process.env.DATABASE_URL) {
    // Development-only bypass for local work without a DB. Never enabled in
    // production — a missing DATABASE_URL must fail closed, not open.
    if (process.env.NODE_ENV === "development") {
      return token.length > 20;
    }
    return false;
  }

  try {
    const tokenHash = hashToken(token);
    const res = await db
      .select()
      .from(schema.adminSessions)
      .where(eq(schema.adminSessions.tokenHash, tokenHash))
      .limit(1);

    if (res.length > 0 && new Date(res[0].expiresAt) > new Date()) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Page-level auth guard for Server Components: redirects to /admin/login
 * when the admin session is invalid. Defense-in-depth on top of the
 * (protected) layout gate — call at the top of every data-loading admin page.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await verifyAdminSession())) {
    redirect("/admin/login");
  }
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token && process.env.DATABASE_URL) {
    try {
      const tokenHash = hashToken(token);
      await db.delete(schema.adminSessions).where(eq(schema.adminSessions.tokenHash, tokenHash));
    } catch {
      // ignore
    }
  }

  cookieStore.delete(COOKIE_NAME);
}

/**
 * Pure password check against a stored value. Supports two formats:
 *
 * - bcrypt hash ("$2a$"/"$2b$"/"$2y$" prefix): constant-time comparison via
 *   bcryptjs. bcrypt truncates at 72 bytes, so the input is pre-hashed with
 *   SHA-256 (hex, 64 chars) to preserve the full entropy of long or multi-byte
 *   passwords. Generate hashes with `npm run hash:admin-password`.
 * - plain text (legacy / local dev): zero-padded timingSafeEqual, no length
 *   short-circuit, no timing side channel.
 */
export function checkPasswordAgainst(stored: string, input: string): boolean {
  const actual = String(input ?? "");
  if (stored.startsWith("$2")) {
    try {
      return bcrypt.compareSync(hashToken(actual), stored);
    } catch {
      // Malformed hash in env must fail closed, never throw to the caller.
      return false;
    }
  }
  const expected = Buffer.from(stored, "utf8");
  const actualBuf = Buffer.from(actual, "utf8");
  const len = Math.max(actualBuf.length, expected.length, 1);
  const a = Buffer.alloc(len);
  const b = Buffer.alloc(len);
  actualBuf.copy(a);
  expected.copy(b);
  return timingSafeEqual(a, b);
}

export function checkAdminPassword(password: string): boolean {
  return checkPasswordAgainst(ADMIN_PASS, password);
}
