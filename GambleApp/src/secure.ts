import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const PEPPER_KEY = "app_pepper_v1";

export async function getOrCreatePepper(): Promise<string> {
  let pepper = await SecureStore.getItemAsync(PEPPER_KEY);
  if (pepper) return pepper;
  // 32 random bytes, base64
  const bytes = Crypto.getRandomBytes(32);
  pepper = Buffer.from(bytes).toString("base64");
  await SecureStore.setItemAsync(PEPPER_KEY, pepper);
  return pepper;
}
