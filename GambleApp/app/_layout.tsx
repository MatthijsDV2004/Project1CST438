import { Stack } from "expo-router";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { useEffect } from "react";
import { installBcryptRandom } from "../src/crypto-polyfill";
export default function RootLayout() {
  useEffect(() => {
    installBcryptRandom(); 
  }, []);
  return (
    <SQLiteProvider databaseName="app.db" onInit={migrateDbIfNeeded}>
      <Stack screenOptions={{ headerShown: false }} />
    </SQLiteProvider>
  );
}

// Mostly boilerplate, but here we are initializing the database.
async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const target = 1;
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  let current = row?.user_version ?? 0;
  if (current < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_data (
        user_id INTEGER NOT NULL,
        data_json TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (user_id)
      );
    `);
    current = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${target}`);
}
