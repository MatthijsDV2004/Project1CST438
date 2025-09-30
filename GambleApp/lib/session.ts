import * as SecureStore from 'expo-secure-store';
import { v4 as uuidv4 } from 'uuid';
import { getDB, Session, User } from './db';
import type { SQLiteDatabase } from 'expo-sqlite';
import bcrypt from 'bcryptjs';
import { getOrCreatePepper } from '@/src/secure';


const SECURE_TOKEN_KEY = 'session_token';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
function withPepper(password: string, pepper: string) {
  return `${password}:${pepper}`;
}
export async function writeSessionFast(db: SQLiteDatabase, userId: number, token: string) {
  const nowIso = new Date().toISOString();
  await Promise.all([
    db.runAsync(
      "INSERT OR REPLACE INTO sessions (user_id, token, created_at) VALUES (?, ?, ?)",
      [userId, token, nowIso]
    ),
    SecureStore.setItemAsync(SECURE_TOKEN_KEY, token),
  ]);
}

export async function createSession(db: SQLiteDatabase, user_id: number) {
  const token = uuidv4();
  const now = Date.now();
  const expires = now + SESSION_TTL_MS;

  await db.runAsync(
    'INSERT INTO sessions (user_id, token, created_at, expires_at) VALUES (?, ?, ?, ?)',
    [user_id, token, now, expires]
  );
  await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
  return token;
}

export async function restoreSession(db: SQLiteDatabase): Promise<{ user: User | null }> {
  const token = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
  if (!token) return { user: null };

  const session = await db.getFirstAsync<Session>(
    'SELECT * FROM sessions WHERE token = ?',
    [token]
  );
  if (!session || session.expires_at <= Date.now()) {
    await logout(db);
    return { user: null };
  }

  const user = await db.getFirstAsync<User>('SELECT * FROM users WHERE id = ?', [session.user_id]);
  if (!user) {
    await logout(db);
    return { user: null };
  }
  return { user };
}
export async function resetPasswordInSession(
  db: SQLiteDatabase,
  { userId, password }: { userId: number; password: string }
) {
  const pepper = await getOrCreatePepper();
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(withPepper(password, pepper), salt);
  await db.runAsync("UPDATE users SET password_hash = ? WHERE id = ?", [hash, userId]);
}
export async function logout(db: SQLiteDatabase) {
  const token = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
  console.log("Logging out, found token:", token);
  
  if (token) {
    await db.runAsync("DELETE FROM sessions WHERE token = ?", [token]);
    console.log("Deleted session from DB");
    await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
  }
}
