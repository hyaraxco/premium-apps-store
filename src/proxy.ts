import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";

const COOKIE_NAME = "sb_admin_token";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/**
 * Cheap pre-filter at the edge: the admin cookie must belong to a live
 * session row. Fail-closed on any DB error or missing DATABASE_URL in
 * production. Full per-page verification still runs in every admin page
 * (requireAdmin) — this only short-circuits requests earlier.
 */
async function isAdminSessionValid(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;

  if (!process.env.DATABASE_URL) {
    // Mirrors the dev-only bypass in src/lib/admin-auth.ts; production
    // without a database must fail closed, never open.
    return process.env.NODE_ENV === "development" && token.length > 20;
  }

  try {
    const res = await db
      .select({ expiresAt: schema.adminSessions.expiresAt })
      .from(schema.adminSessions)
      .where(eq(schema.adminSessions.tokenHash, hashToken(token)))
      .limit(1);
    return res.length > 0 && new Date(res[0].expiresAt) > new Date();
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow /admin/login without a session
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Protect all other /admin routes (defense in depth on top of requireAdmin)
  if (pathname.startsWith("/admin") && !(await isAdminSessionValid(request))) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/checkout/:path*"],
};
