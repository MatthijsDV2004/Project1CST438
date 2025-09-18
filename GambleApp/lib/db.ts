import * as SQLite from "expo-sqlite";

export type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  security_question: string;
  currency: number;
  created_at: string;
};

export type Session = {
  id: number;
  user_id: number;
  token: string;
  created_at: number;
  expires_at: number;
};

// If you want manual DB access outside <SQLiteProvider>
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
export function getDB() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("app.db");
  }
  return dbPromise!;
}

// Correct initDb for SQLiteProvider
export async function initDb(db: SQLite.SQLiteDatabase) {
  console.log("Init DB running");

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name  TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      security_question TEXT NOT NULL,
      currency INTEGER DEFAULT 500,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      currency INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS betts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sport TEXT NOT NULL,
      team1 TEXT NOT NULL,
      team2 TEXT NOT NULL,
      bett_amount INTEGER NOT NULL,
      is_current_bett BOOLEAN NOT NULL,
      moneyline INTEGER,
      time DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  `);
}
