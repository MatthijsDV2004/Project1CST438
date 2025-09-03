import bcrypt from "bcryptjs";
import type { SQLiteDatabase } from "expo-sqlite";
import { getOrCreatePepper } from "./secure";
import { get, run } from "../src/db";

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
