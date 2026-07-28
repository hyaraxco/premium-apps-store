import { cookies } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";

const COOKIE_NAME = "sb_admin_token";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "local-admin-dev";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export async function createAdminSession(): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours

  if (process.env.DATABASE_URL) {
    try {
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
    // Development bypass if token matches expected length
    return token.length > 20;
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

// In MVP, admin password is from env var. A constant-time check prevents timing attacks.
export function checkAdminPassword(password: string): boolean {
  if (password.length !== ADMIN_PASS.length) return false;
  let match = 0;
  for (let i = 0; i < password.length; i++) {
    match |= password.charCodeAt(i) ^ ADMIN_PASS.charCodeAt(i);
  }
  return match === 0;
}
