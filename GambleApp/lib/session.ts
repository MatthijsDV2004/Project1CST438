import * as SecureStore from 'expo-secure-store';
import { v4 as uuidv4 } from 'uuid';
import { getDB, Session, User } from './db';

const SECURE_TOKEN_KEY = 'session_token';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(user_id: number) {
  const db = await getDB();
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

export async function restoreSession(): Promise<{ user: User | null }> {
  const db = await getDB();
  const token = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
  if (!token) return { user: null };

  const session = await db.getFirstAsync<Session>(
    'SELECT * FROM sessions WHERE token = ?',
    [token]
  );
  if (!session || session.expires_at <= Date.now()) {
    await logout();
    return { user: null };
  }

  const user = await db.getFirstAsync<User>('SELECT * FROM users WHERE id = ?', [session.user_id]);
  if (!user) {
    await logout();
    return { user: null };
  }
  return { user };
}

export async function logout() {
  const db = await getDB();
  const token = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
  if (token) {
    await db.runAsync('DELETE FROM sessions WHERE token = ?', [token]);
    await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
  }
}
