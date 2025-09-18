import bcrypt from "bcryptjs";
import type { SQLiteDatabase } from "expo-sqlite";
import { getOrCreatePepper } from "./secure";
import * as Random from "expo-random";
const COST = 12;


bcrypt.setRandomFallback(len => {
  // expo-random returns Uint8Array
  const bytes = Random.getRandomBytes(len);
  return Array.from(bytes).map(b => b % 256);
});

function withPepper(password: string, pepper: string) {
  return `${password}:${pepper}`;
}

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  securityQuestion: string;
};

export type PasswordReset = {
  email: string;
  password: string;
  securityQuestion: string;
};

// Register new user with bcrypt + pepper
export async function registerUser(db: SQLiteDatabase, input: RegisterInput) {
  const email = input.email.trim().toLowerCase();

  // Check for duplicate
  const existing = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );
  if (existing) {
    const err: any = new Error("EMAIL_IN_USE");
    err.code = "EMAIL_IN_USE";
    throw err;
  }

  // Hash with bcrypt + pepper
  const pepper = await getOrCreatePepper();
  const salt = await bcrypt.genSalt(COST);
  const hash = await bcrypt.hash(withPepper(input.password, pepper), salt);

  // Insert (now includes security_question!)
  const res = await db.runAsync(
    `INSERT INTO users (first_name, last_name, email, password_hash, security_question, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [
      input.firstName.trim(),
      input.lastName.trim(),
      email,
      hash,
      input.securityQuestion.trim(),
    ]
  );

  return { id: Number(res.lastInsertRowId) };
}

// Verify login
export async function verifyLogin(
  db: SQLiteDatabase,
  email: string,
  password: string
) {
  const row = await db.getFirstAsync<{ id: number; password_hash: string }>(
    `SELECT id, password_hash FROM users WHERE email = ?`,
    [email.trim().toLowerCase()]
  );

  if (!row) return { ok: false as const, reason: "not_found" };

  const pepper = await getOrCreatePepper();
  const ok = await bcrypt.compare(
    withPepper(password, pepper),
    row.password_hash
  );

  return ok
    ? { ok: true as const, userId: row.id }
    : { ok: false as const, reason: "bad_credentials" };
}

export async function resetPassword(db: SQLiteDatabase, input: PasswordReset) {
  const email = input.email.trim().toLowerCase();

  // Check for existing email
  const user = await db.getFirstAsync<{ id: number; security_question: string }>(
    "SELECT id, security_question FROM users WHERE email = ?",
    [email]
  );

  if (!user) {
    const err: any = new Error("USER_NOT_FOUND");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

    // Check security question
    if (user.security_question !== input.securityQuestion.trim()) {
      const err: any = new Error("SECURITY_MISMATCH");
      err.code = "SECURITY_MISMATCH";
      throw err;
    }

  // Generate hash
  const pepper = await getOrCreatePepper();
  const salt = await bcrypt.genSalt(COST);
  const hash = await bcrypt.hash(withPepper(input.password, pepper), salt);

  // Update password
  await db.runAsync(
    `UPDATE users SET password_hash = ? WHERE id = ?`,
    [hash, user.id]
  );

  return { id: user.id, email };
}