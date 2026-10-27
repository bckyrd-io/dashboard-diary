import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { SCHEMA_SQL, SCHEMA_VERSION } from './schema';
import type { OfflineDb } from './db';

let dbPromise: Promise<OfflineDb> | null = null;

function wrap(db: SQLiteDatabase): OfflineDb {
  return {
    execAsync: (sql: string) => db.execAsync(sql),
    runAsync: async (sql: string, params?: unknown[]) => {
      const result = await db.runAsync(sql, (params ?? []) as never);
      return { lastInsertRowId: result.lastInsertRowId, changes: result.changes };
    },
    getAllAsync: <T = unknown>(sql: string, params?: unknown[]) =>
      db.getAllAsync<T>(sql, (params ?? []) as never),
    getFirstAsync: <T = unknown>(sql: string, params?: unknown[]) =>
      db.getFirstAsync<T>(sql, (params ?? []) as never),
    withTransactionAsync: (fn: () => Promise<void>) => db.withTransactionAsync(fn),
  };
}

export function isOfflineDbAvailable(): boolean {
  return true;
}

export async function initOfflineDb(): Promise<OfflineDb> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const native = await openDatabaseAsync('sneaker_lounge.db');
      await native.execAsync('PRAGMA journal_mode = WAL;');
      await native.execAsync(SCHEMA_SQL);
      await native.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
      return wrap(native);
    })();
  }

  return dbPromise;
}

export async function getOfflineDb(): Promise<OfflineDb> {
  return initOfflineDb();
}
