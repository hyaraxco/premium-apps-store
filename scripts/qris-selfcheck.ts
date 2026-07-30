import {
  crc16,
  generateDynamicQris,
  isValidQrisStatic,
  parseEmvTlv,
  DEFAULT_MERCHANT_QRIS_STATIC,
} from "../src/lib/qris";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function runTests() {
  // CRC catalogue vector CRC-16/IBM-3740 (CCITT-FALSE)
  assert(crc16("123456789") === "29B1", `CRC vector fail: ${crc16("123456789")}`);

  const staticPayload = DEFAULT_MERCHANT_QRIS_STATIC;
  assert(isValidQrisStatic(staticPayload), "Real GoPay static CRC/TLV invalid");

  const dynamicPayload = generateDynamicQris(staticPayload, 55000);
  assert(dynamicPayload.includes("010212"), "POI not set to dynamic 12");
  assert(dynamicPayload.includes("540555000"), "Tag 54 amount 55000 missing");

  const els = parseEmvTlv(dynamicPayload);
  const t54 = els.find((e) => e.tag === "54");
  assert(t54?.value === "55000", `Tag 54 value wrong: ${t54?.value}`);
  const t01 = els.find((e) => e.tag === "01");
  assert(t01?.value === "12", `Tag 01 wrong: ${t01?.value}`);
  const t26 = els.find((e) => e.tag === "26");
  assert(
    !!t26 && t26.value.includes("COM.GO-JEK.WWW"),
    "Merchant MAI Tag 26 corrupted",
  );
  const t51 = els.find((e) => e.tag === "51");
  assert(
    !!t51 && t51.value.includes("ID.CO.QRIS.WWW"),
    "National QRIS Tag 51 corrupted",
  );

  const checksum = dynamicPayload.slice(-4);
  assert(/^[0-9A-F]{4}$/.test(checksum), `Bad checksum format: ${checksum}`);
  assert(
    crc16(dynamicPayload.slice(0, -4)) === checksum,
    `CRC mismatch: expect ${crc16(dynamicPayload.slice(0, -4))} got ${checksum}`,
  );

  // Larger amount (promo cart)
  const dyn2 = generateDynamicQris(staticPayload, 200000);
  assert(dyn2.includes("5406200000"), "Tag 54 for 200000 missing");
  assert(isValidQrisStatic(dyn2), "Dynamic payload self-CRC invalid");

  // Zero amount edge
  const zero = generateDynamicQris(staticPayload, 0);
  assert(zero.includes("54010"), "Tag 54 amount 0 missing");

  console.log("qris-dynamic self-check OK");
  console.log(`[Info] CRC for 55000: ${checksum}`);
  console.log(`[Info] CRC for 200000: ${dyn2.slice(-4)}`);
}

runTests();
