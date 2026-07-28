import {
  createPublicOrderToken,
  hashPublicOrderToken,
} from "../src/lib/order-token";
import { paymentExpiresAt, paymentTtlMs } from "../src/lib/pricing";

const a = createPublicOrderToken();
const b = createPublicOrderToken();
if (a.raw === b.raw) throw new Error("tokens not unique");
if (a.hash === a.raw) throw new Error("hash must differ from raw");
if (hashPublicOrderToken(a.raw) !== a.hash) throw new Error("hash mismatch");
if (a.hash.length !== 64) throw new Error("sha256 hex length");

if (paymentTtlMs("qris") !== 10 * 60 * 1000) throw new Error("qris ttl");
if (paymentTtlMs("bca") !== 30 * 60 * 1000) throw new Error("bca ttl");
const from = new Date("2026-01-01T00:00:00.000Z");
const exp = paymentExpiresAt("qris", from);
if (exp.getTime() - from.getTime() !== 600_000) throw new Error("expires at");

console.log("order-token + ttl self-check OK");
