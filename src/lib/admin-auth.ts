import { cookies } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, gte } from "drizzle-orm";

const COOKIE_NAME = "sb_admin_token";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "stackbay123!";

export async function createAdminSession(): Promise<string> {
  const token = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours

  if (process.env.DATABASE_URL) {
    try {
      await db.insert(schema.adminSessions).values({
        token,
        expiresAt,
      });
    } catch {
      // ignore
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

  // Development bypass if token matches expected prefix
  if (token.startsWith("sess-") && !process.env.DATABASE_URL) {
    return true;
  }

  if (process.env.DATABASE_URL) {
    try {
      const res = await db
        .select()
        .from(schema.adminSessions)
        .where(
          eq(schema.adminSessions.token, token)
        )
        .limit(1);

      if (res.length > 0 && new Date(res[0].expiresAt) > new Date()) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token && process.env.DATABASE_URL) {
    try {
      await db.delete(schema.adminSessions).where(eq(schema.adminSessions.token, token));
    } catch {
      // ignore
    }
  }

  cookieStore.delete(COOKIE_NAME);
}

export function checkAdminPassword(password: string): boolean {
  return password === ADMIN_PASS;
}
