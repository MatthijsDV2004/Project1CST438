import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const PEPPER_KEY = "app_pepper_v1";
// All this is for security for the password(Hash) adds pepper.
function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

export async function getOrCreatePepper(): Promise<string> {
  let pepper = await SecureStore.getItemAsync(PEPPER_KEY);
  if (pepper) return pepper;

  const bytes = Crypto.getRandomBytes(32); // 32 random bytes
  pepper = bytesToHex(bytes);              // hex encode, no Buffer needed
  await SecureStore.setItemAsync(PEPPER_KEY, pepper);
  return pepper;
}
