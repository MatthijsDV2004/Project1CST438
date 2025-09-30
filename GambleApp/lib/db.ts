import * as SQLite from "expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";
export type BetStatus = "open" | "won" | "lost" | "void";

export type Bet = {
  id: number;
  user_id: number;
  sport: string;
  team1: string;
  team2: string;
  selected_team: string;
  bett_amount: number;
  is_current_bett: 0 | 1;
  moneyline?: number | null;
  time: string; // ISO 8601
};
export type NewBet = Omit<Bet, "id" | "is_current_bett"> & {
  is_current_bett?: 0 | 1;
};
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

export async function placeBet(
  db: SQLiteDatabase,
  input: NewBet
): Promise<number> {
  // Ensure table exists (no-op if already created)
  await db.runAsync(
    `CREATE TABLE IF NOT EXISTS betts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sport TEXT NOT NULL,
      team1 TEXT NOT NULL,
      team2 TEXT NOT NULL,
      selected_team TEXT NOT NULL, 
      bett_amount REAL NOT NULL,
      is_current_bett INTEGER NOT NULL DEFAULT 1,
      moneyline REAL,
      time DATETIME NOT NULL
    )`
  );

  const result: any = await db.runAsync(
    `INSERT INTO betts (
      user_id, sport, team1, team2, selected_team, bett_amount, is_current_bett, moneyline, time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.user_id,
      input.sport,
      input.team1,
      input.team2,
      input.selected_team,
      input.bett_amount,
      input.is_current_bett ?? 1,
      input.moneyline ?? null,
      input.time,
    ]
  );

  return typeof result?.lastInsertRowId === "number" ? result.lastInsertRowId : 0;
}
   export async function getCurrentBets(db: SQLiteDatabase, userId: number) {
  return db.getAllAsync(
    "SELECT * FROM betts WHERE user_id = ? AND is_current_bett = 1 ORDER BY time DESC",
    [userId]
  );
}

export async function getPreviousBets(db: SQLiteDatabase, userId: number) {
  return db.getAllAsync(
    "SELECT * FROM betts WHERE user_id = ? AND is_current_bett = 0 ORDER BY time DESC",
    [userId]
  );
}
export async function getUserCredits(db: SQLiteDatabase, userId: number): Promise<number> {
  const row: any = await db.getFirstAsync("SELECT currency FROM users WHERE id = ?", [userId]);
  return row?.currency ?? 0;
}

// Add credits
export async function addCredits(db: SQLiteDatabase, userId: number, amount: number) {
  await db.runAsync("UPDATE users SET currency = currency + ? WHERE id = ?", [amount, userId]);
}

// Subtract credits
export async function subtractCredits(db: SQLiteDatabase, userId: number, amount: number) {
  await db.runAsync("UPDATE users SET currency = MAX(currency - ?, 0) WHERE id = ?", [amount, userId]);
}

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
      selected_team TEXT NOT NULL, 
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
