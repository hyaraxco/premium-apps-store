import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * In-memory fallback if DB is not available
 */
const fallbackTracker = new Map<string, { count: number; expiresAt: number }>();

/**
 * Durable Rate Limiter (Backed by Neon Postgres)
 * Limits requests per identifier (e.g., email or IP).
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests = 5,
  windowMs = 10 * 60 * 1000 // 10 minutes
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();

  // If DB not available, use in-memory fallback
  if (!process.env.DATABASE_URL) {
    const record = fallbackTracker.get(identifier);
    if (!record || now > record.expiresAt) {
      fallbackTracker.set(identifier, { count: 1, expiresAt: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }
    if (record.count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    record.count += 1;
    return { allowed: true, remaining: maxRequests - record.count };
  }

  // Use DB table `admin_settings` for durable KV store (acting as rate-limit store)
  const key = `ratelimit_${identifier}`;
  
  try {
    const res = await db.select().from(schema.adminSettings).where(eq(schema.adminSettings.key, key)).limit(1);
    
    if (res.length === 0) {
      // First request in window
      const val = JSON.stringify({ count: 1, expiresAt: now + windowMs });
      await db.insert(schema.adminSettings).values({ key, value: val, updatedAt: new Date() });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    const record = JSON.parse(res[0].value) as { count: number; expiresAt: number };

    // Window expired, reset counter
    if (now > record.expiresAt) {
      const val = JSON.stringify({ count: 1, expiresAt: now + windowMs });
      await db.update(schema.adminSettings).set({ value: val, updatedAt: new Date() }).where(eq(schema.adminSettings.key, key));
      return { allowed: true, remaining: maxRequests - 1 };
    }

    // Limit exceeded
    if (record.count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    // Increment counter
    const newCount = record.count + 1;
    const val = JSON.stringify({ count: newCount, expiresAt: record.expiresAt });
    await db.update(schema.adminSettings).set({ value: val, updatedAt: new Date() }).where(eq(schema.adminSettings.key, key));
    
    return { allowed: true, remaining: maxRequests - newCount };
  } catch (e) {
    console.error("Rate limit DB error:", e);
    // Fall open on DB error to avoid blocking checkouts unnecessarily
    return { allowed: true, remaining: 1 };
  }
}
