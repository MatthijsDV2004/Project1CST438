
import bcrypt from "bcryptjs";
import * as Crypto from "expo-crypto";

// Creates a proper source of randomness for the bycrypt because we lack Web Crypto.
export function installBcryptRandom() {

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

  
  bcrypt.setRandomFallback((len: number) =>
    Array.from(Crypto.getRandomBytes(len))
  );
}
