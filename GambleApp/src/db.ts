import { useSQLiteContext, type SQLiteDatabase } from "expo-sqlite";

export function useDb(): SQLiteDatabase {
  // Use this inside components/hooks to access the DB from the Provider
  return useSQLiteContext();
}

export async function all<T>(db: SQLiteDatabase, sql: string, ...params: any[]): Promise<T[]> {
  return db.getAllAsync<T>(sql, ...params);
}

export async function get<T>(db: SQLiteDatabase, sql: string, ...params: any[]): Promise<T | undefined> {
  try {
     await db.getFirstAsync<T>(sql, ...params);
  } catch {
    return undefined;
  }
}

export async function run(db: SQLiteDatabase, sql: string, ...params: any[]): Promise<void> {
  await db.runAsync(sql, ...params);
}
