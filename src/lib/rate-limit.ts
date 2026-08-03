import { withTransaction } from "@/db/tx";
import * as schema from "@/db/schema";
import { and, eq, like, lt } from "drizzle-orm";

/** Ratelimit rows older than this are never in an active window (max 15 min). */
const RATELIMIT_GC_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Typed encode/decode for JSON blobs stored in admin_settings.value (which is
 * a TEXT column — see schema.ts). Malformed/missing rows fall back instead of
 * throwing, so a corrupted row can never bypass or hard-fail the limiter.
 */
type RateWindow = { count: number; expiresAt: number };

function encodeWindow(w: RateWindow): string {
  return JSON.stringify(w);
}

function decodeWindow(raw: string): RateWindow | null {
  try {
    const parsed = JSON.parse(raw) as Partial<RateWindow>;
    if (
      typeof parsed.count !== "number" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }
    return { count: parsed.count, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

/**
 * In-memory fallback limiter (per-instance) when the DB is unavailable.
 */
const fallbackTracker = new Map<string, { count: number; expiresAt: number }>();

function memoryCheck(
  identifier: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
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

/**
 * Durable Rate Limiter (backed by Neon Postgres).
 * Limits requests per identifier (e.g., email or IP).
 *
 * Concurrency: the read-modify-write on the counter happens inside an
 * interactive transaction with SELECT ... FOR UPDATE, so concurrent requests
 * serialize on the row instead of racing past the limit.
 *
 * Degradation: on DB error the limiter falls back to the in-memory tracker
 * (per-instance) rather than disabling rate limiting entirely.
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests = 5,
  windowMs = 10 * 60 * 1000 // 10 minutes
): Promise<{ allowed: boolean; remaining: number }> {
  // If DB not available, use in-memory fallback
  if (!process.env.DATABASE_URL) {
    return memoryCheck(identifier, maxRequests, windowMs);
  }

  // Use DB table `admin_settings` for durable KV store (acting as rate-limit store)
  const key = `ratelimit_${identifier}`;

  try {
    return await withTransaction(async (tx) => {
      const res = await tx
        .select()
        .from(schema.adminSettings)
        .where(eq(schema.adminSettings.key, key))
        .for("update")
        .limit(1);

      const now = Date.now();

      if (res.length === 0) {
        // First request in window
        await tx
          .insert(schema.adminSettings)
          .values({
            key,
            value: encodeWindow({ count: 1, expiresAt: now + windowMs }),
            updatedAt: new Date(),
          });
        // GC: purge stale ratelimit rows (scoped to the ratelimit_ prefix so
        // real admin settings are never touched) to prevent unbounded growth.
        await tx
          .delete(schema.adminSettings)
          .where(
            and(
              like(schema.adminSettings.key, "ratelimit_%"),
              lt(schema.adminSettings.updatedAt, new Date(now - RATELIMIT_GC_AGE_MS)),
            ),
          );
        return { allowed: true, remaining: maxRequests - 1 };
      }

      // Window expired (or the stored row is malformed) → reset counter
      const record = decodeWindow(res[0].value);
      if (!record || now > record.expiresAt) {
        await tx
          .update(schema.adminSettings)
          .set({
            value: encodeWindow({ count: 1, expiresAt: now + windowMs }),
            updatedAt: new Date(),
          })
          .where(eq(schema.adminSettings.key, key));
        return { allowed: true, remaining: maxRequests - 1 };
      }

      // Limit exceeded
      if (record.count >= maxRequests) {
        return { allowed: false, remaining: 0 };
      }

      // Increment counter
      const newCount = record.count + 1;
      await tx
        .update(schema.adminSettings)
        .set({
          value: encodeWindow({ count: newCount, expiresAt: record.expiresAt }),
          updatedAt: new Date(),
        })
        .where(eq(schema.adminSettings.key, key));

      return { allowed: true, remaining: maxRequests - newCount };
    });
  } catch (e) {
    console.error("Rate limit DB error, degrading to in-memory limiter:", e);
    // Degrade to per-instance limiting instead of disabling rate limiting.
    return memoryCheck(identifier, maxRequests, windowMs);
  }
}
