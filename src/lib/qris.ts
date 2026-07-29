/**
 * EMVCo QRIS Dynamic Generator
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

export function generateDynamicQris(staticQris: string, amount: number): string {
  if (!staticQris) return "";

  let base = staticQris.trim();
  const crcIndex = base.indexOf("6304");
  if (crcIndex !== -1) {
    base = base.substring(0, crcIndex);
  }

  // Change Point of Initiation Method from Static (11) to Dynamic (12)
  base = base.replace("010211", "010212");

  const amountStr = Math.round(amount).toString();
  const tag54 = `54${amountStr.length.toString().padStart(2, "0")}${amountStr}`;

  // Find position to insert Tag 54. Safest is before Tag 58 (Country Code ID)
  const tag58Index = base.indexOf("5802ID");
  
  let payload = "";
  if (tag58Index !== -1) {
    payload = base.substring(0, tag58Index) + tag54 + base.substring(tag58Index);
  } else {
    payload = base + tag54;
  }

  payload += "6304";
  const checksum = crc16(payload);
  return payload + checksum;
}
