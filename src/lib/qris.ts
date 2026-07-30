/**
 * EMVCo / QRIS MPM: static merchant QR → dynamic (amount Tag 54).
 * Top-level TLV only; nested MAI (26–51) left intact as opaque values.
 */

export function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

type Tlv = { tag: string; value: string };

export function parseEmvTlv(payload: string): Tlv[] {
  const out: Tlv[] = [];
  let i = 0;
  while (i + 4 <= payload.length) {
    const tag = payload.slice(i, i + 2);
    const len = parseInt(payload.slice(i + 2, i + 4), 10);
    if (!Number.isFinite(len) || len < 0 || i + 4 + len > payload.length) {
      throw new Error(`Invalid EMV TLV at offset ${i} (tag ${tag})`);
    }
    out.push({ tag, value: payload.slice(i + 4, i + 4 + len) });
    i += 4 + len;
  }
  if (i !== payload.length) {
    throw new Error(`Trailing EMV data at offset ${i}`);
  }
  return out;
}

export function buildEmvTlv(elements: Tlv[]): string {
  return elements
    .map((el) => {
      const len = el.value.length;
      if (len > 99) throw new Error(`TLV value too long for tag ${el.tag}`);
      return `${el.tag}${len.toString().padStart(2, "0")}${el.value}`;
    })
    .join("");
}

/** Real merchant static from GoPay sticker (decoded from src/src/img/qris_gopay.jpeg). */
export const DEFAULT_MERCHANT_QRIS_STATIC =
  "00020101021126610014COM.GO-JEK.WWW01189360091430354699480210G0354699480303UMI51440014ID.CO.QRIS.WWW0215ID10254005290260303UMI5204581253033605802ID5923Warung Bu Dir, TJHALANG6005BOGOR61051632062070703A0163040971";

/**
 * Convert static MPM QRIS to dynamic with Tag 54 amount (whole IDR).
 * - Tag 01: 11 → 12
 * - Insert/replace Tag 54 before Tag 58
 * - Drop Tag 63; append 6304 + CRC-16/CCITT-FALSE over payload including "6304"
 */
export function generateDynamicQris(staticQris: string, amount: number): string {
  if (!staticQris?.trim()) return "";

  let raw = staticQris.trim();
  // Drop existing CRC tag if present (keep body only for re-parse)
  const crcIdx = raw.lastIndexOf("6304");
  if (crcIdx !== -1 && crcIdx + 8 === raw.length) {
    raw = raw.slice(0, crcIdx);
  } else if (crcIdx !== -1) {
    // CRC may already be stripped; if trailing 6304 alone, drop it
    if (raw.endsWith("6304")) raw = raw.slice(0, -4);
  }

  let els = parseEmvTlv(raw);

  const poi = els.find((e) => e.tag === "01");
  if (poi) poi.value = "12";
  else els.unshift({ tag: "01", value: "12" });

  const amt = Math.round(amount).toString();
  if (!/^\d{1,13}$/.test(amt)) {
    throw new Error("QRIS amount must be 1–13 digits");
  }

  els = els.filter((e) => e.tag !== "54" && e.tag !== "63");
  const i58 = els.findIndex((e) => e.tag === "58");
  if (i58 === -1) throw new Error("QRIS missing country code Tag 58");
  els.splice(i58, 0, { tag: "54", value: amt });

  const withoutCrc = buildEmvTlv(els) + "6304";
  return withoutCrc + crc16(withoutCrc);
}

/** True if payload parses as top-level EMV and CRC matches (when Tag 63 present). */
export function isValidQrisStatic(payload: string): boolean {
  try {
    const raw = payload.trim();
    const els = parseEmvTlv(raw);
    const crcEl = els.find((e) => e.tag === "63");
    if (!crcEl || crcEl.value.length !== 4) return false;
    const body = buildEmvTlv(els.filter((e) => e.tag !== "63")) + "6304";
    return crc16(body) === crcEl.value.toUpperCase();
  } catch {
    return false;
  }
}
