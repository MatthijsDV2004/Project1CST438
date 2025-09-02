
import bcrypt from "bcryptjs";
import * as Crypto from "expo-crypto";

/** Install secure randomness for bcrypt (RN/Expo) */
export function installBcryptRandom() {
  // Provide window/global crypto.getRandomValues if missing
  if (
    typeof globalThis.crypto === "undefined" ||
    typeof (globalThis.crypto as any).getRandomValues !== "function"
  ) {
    (globalThis as any).crypto = (globalThis as any).crypto || {};
    (globalThis.crypto as any).getRandomValues = (arr: Uint8Array) => {
      const rnd = Crypto.getRandomBytes(arr.length);
      arr.set(rnd);
      return arr;
    };
  }

  // Tell bcryptjs how to get random bytes
  bcrypt.setRandomFallback((len: number) =>
    Array.from(Crypto.getRandomBytes(len))
  );
}
