import { encryptText, decryptText } from "../src/lib/crypto";

const samplePassword = "MySecretPassword123!@#";

// 1. Encrypt
const ciphertext = encryptText(samplePassword);
console.log("Encrypted:", ciphertext);

// Basic validation
if (ciphertext === samplePassword) throw new Error("Ciphertext is identical to plaintext");
if (ciphertext.split(":").length !== 3) throw new Error("Ciphertext format invalid");

// 2. Decrypt
const decrypted = decryptText(ciphertext);
console.log("Decrypted:", decrypted);

if (decrypted !== samplePassword) throw new Error("Decryption mismatch");

// 3. Fallback invalid format
const fake = decryptText("PlaintextFallback");
if (fake !== "PlaintextFallback") throw new Error("Legacy fallback broken");

console.log("Crypto self-check OK");
