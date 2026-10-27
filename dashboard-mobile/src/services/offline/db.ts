// Offline database facade.
//
// Metro resolves `./db` to `db.native.ts` on Android/iOS and to `db.web.ts` on
// web. This generic module is the fallback (and what TypeScript resolves), so
// every platform module must export the same runtime surface.

export interface OfflineDb {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
}

export class OfflineUnavailableError extends Error {
  constructor(message = 'Offline storage is not available on this platform') {
    super(message);
    this.name = 'OfflineUnavailableError';
  }
}

export function isOfflineDbAvailable(): boolean {
  return false;
}

export async function getOfflineDb(): Promise<OfflineDb> {
  throw new OfflineUnavailableError();
}

export async function initOfflineDb(): Promise<OfflineDb | null> {
  return null;
}
