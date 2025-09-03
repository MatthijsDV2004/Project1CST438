import type { SQLiteDatabase } from "expo-sqlite";
import { get, run } from "./db";
//This will likely change but just a placeholder for user data.
export async function setUserData(db: SQLiteDatabase, userId: number, data: unknown) {
  const json = JSON.stringify(data);
  await run(
    db,
    `INSERT INTO user_data (user_id, data_json) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET data_json=excluded.data_json`,
    userId,
    json
  );
}

export async function getUserData<T = any>(db: SQLiteDatabase, userId: number): Promise<T | null> {
  const row = await get<{ data_json: string }>(db, `SELECT data_json FROM user_data WHERE user_id = ?`, userId);
  return row ? (JSON.parse(row.data_json) as T) : null;
}
