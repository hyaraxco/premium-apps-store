/**
 * EMVCo QRIS Dynamic Generator
 * Converts static QRIS string into dynamic QRIS string with embedded amount.
 */

// CRC16-CCITT (Kermit / False 0xFFFF)
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x0001) !== 0) {
        crc = (crc >> 1) ^ 0x8408;
      } else {
        crc >>= 1;
      }
    }
  }
  crc ^= 0xffff;
  // Convert to 4 hex uppercase characters, byte-swapped if needed for EMVCo
  const hex = crc.toString(16).toUpperCase().padStart(4, "0");
  return hex.substring(2, 4) + hex.substring(0, 2);
}

/**
 * Generates a dynamic QRIS string with an embedded IDR amount.
 */
export function generateDynamicQris(staticQris: string, amount: number): string {
  if (!staticQris) return "";

  // Remove existing CRC if present at the end (Tag 63)
  let base = staticQris.trim();
  const crcIndex = base.indexOf("6304");
  if (crcIndex !== -1) {
    base = base.substring(0, crcIndex);
  }

  // Format Tag 54 (Transaction Amount)
  const amountStr = Math.round(amount).toString();
  const tag54 = `54${amountStr.length.toString().padStart(2, "0")}${amountStr}`;

  // Check if Tag 58 (Country Code ID) or Tag 53 (Currency Code 360) exists
  // Tag 58 is usually followed by Tag 53
  const tag58Index = base.indexOf("5802ID");
  let payload = "";

  if (tag58Index !== -1) {
    // Insert Tag 54 right after Tag 5802ID
    const insertPos = tag58Index + 6;
    payload = base.substring(0, insertPos) + tag54 + base.substring(insertPos);
  } else {
    // Append Tag 54 to the base payload
    payload = base + tag54;
  }

  // Append Tag 6304 for CRC calculation
  payload += "6304";

  // Calculate & append CRC16
  const checksum = crc16(payload);
  return payload + checksum;
}
