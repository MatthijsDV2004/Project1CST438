import bcrypt from "bcryptjs";
import type { SQLiteDatabase } from "expo-sqlite";
import { getOrCreatePepper } from "./secure";
import { get, run } from "../src/db";
import * as Crypto from 'expo-crypto';
import * as Random from 'expo-random';

const COST = 12;
function withPepper(password: string, pepper: string) {
  return `${password}:${pepper}`;
}
// Creates user. Adds pepper(secret from a key converted to hash), salt(random value), and hash.
export async function createUser(db: SQLiteDatabase, username: string, password: string) {
  const pepper = await getOrCreatePepper();
  const salt = await bcrypt.genSalt(COST);
  const hash = await bcrypt.hash(withPepper(password, pepper), salt);

  const now = new Date().toISOString();
  await run(
    db,
    `INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)`,
    username.trim(),
    hash,
    now
  );
}
// Verifies password for login. Converts password into hash + salt/pepper and cross examines in DB.

export async function verifyLogin(db: SQLiteDatabase, username: string, password: string) {
  const row = await get<{ id: number; password_hash: string }>(
    db,
    `SELECT id, password_hash FROM users WHERE username = ?`,
    username.trim()
  );
  if (!row) return { ok: false as const, reason: "not_found" };

  const pepper = await getOrCreatePepper();
  const ok = await bcrypt.compare(withPepper(password, pepper), row.password_hash);
  return ok ? { ok: true as const, userId: row.id } : { ok: false as const, reason: "bad_credentials" };
}
function toHex(bytes: Uint8Array) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export async function registerUser(db: SQLiteDatabase, input: RegisterInput) {
  const email = input.email.trim().toLowerCase();

  // Enforce unique email at the app level (DB also enforces UNIQUE)
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );
  if (existing) {
    const err = new Error('EMAIL_IN_USE');
    // @ts-expect-error add a code
    (err.code = 'EMAIL_IN_USE');
    throw err;
  }

  const saltBytes = await Crypto.getRandomBytesAsync(16);
  const salt = toHex(saltBytes);

  const password_hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${input.password}`
  );

  const res = await db.runAsync(
    `INSERT INTO users (first_name, last_name, email, password_hash, password_salt)
     VALUES (?, ?, ?, ?, ?)`,
    [input.firstName.trim(), input.lastName.trim(), email, password_hash, salt]
  );

  // Optionally: return the new user id
  return { id: Number(res.lastInsertRowId) };
}