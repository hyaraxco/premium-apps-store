const tracker = new Map<string, { count: number; expiresAt: number }>();

/**
 * In-memory sliding window rate limiter
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = 5,
  windowMs = 10 * 60 * 1000 // 10 minutes
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = tracker.get(identifier);

  if (!record || now > record.expiresAt) {
    tracker.set(identifier, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count };
}
