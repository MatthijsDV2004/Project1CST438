import { useSQLiteContext, type SQLiteDatabase } from "expo-sqlite";
// hooses DB
export function useDb(): SQLiteDatabase {
  return useSQLiteContext();
}

export async function all<T>(db: SQLiteDatabase, sql: string, ...params: any[]): Promise<T[]> {
  return db.getAllAsync<T>(sql, ...params);
}
// Get data from DB
export async function get<T>(
  db: SQLiteDatabase,
  sql: string,
  ...params: any[]
): Promise<T | undefined> {
  try {
    const row = await db.getFirstAsync<T>(sql, ...params);
    return row ?? undefined;
  } catch {
    return undefined;
  }
}
// Execute query
export async function run(db: SQLiteDatabase, sql: string, ...params: any[]): Promise<void> {
  await db.runAsync(sql, ...params);
}
