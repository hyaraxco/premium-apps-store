import { createHash, randomBytes } from "crypto";

/** Unguessable public tracking token; store only SHA-256 hash in DB. */
export function createPublicOrderToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(raw, "utf8").digest("hex");
  return { raw, hash };
}

export function hashPublicOrderToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export function createIdempotencyKey(): string {
  return randomBytes(16).toString("hex");
}

export function generateOrderId(now = new Date()): string {
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `SB-${yyyymmdd}-${rand}`;
}
