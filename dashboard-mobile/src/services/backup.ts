// JSON backup export/import for the server database.
//
// Deliberately a leaf module: it only depends on the low-level HTTP helpers
// and the Expo file/sharing APIs, so neither the offline engine nor the API
// service ever needs to know backups exist. Screens call these functions
// directly from the Settings screen.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { rawRequest } from './http';

export const BACKUP_TABLES = [
  'branches',
  'users',
  'categories',
  'items',
  'events',
  'event_items',
  'schedules',
  'performance',
  'notifications',
] as const;

export interface ServerBackup {
  version: number;
  scope?: string;
  exportedAt?: string;
  tables: Record<string, unknown[]>;
}

export interface BackupCounts {
  counts: Record<string, number>;
  total: number;
}

export class BackupCancelledError extends Error {
  constructor() {
    super('File selection cancelled');
    this.name = 'BackupCancelledError';
  }
}

export function isBackupCancelled(error: unknown): boolean {
  return error instanceof BackupCancelledError;
}

export function countBackupRows(backup: ServerBackup): BackupCounts {
  const counts: Record<string, number> = {};
  let total = 0;
  for (const table of BACKUP_TABLES) {
    const rows = Array.isArray(backup.tables[table]) ? backup.tables[table].length : 0;
    counts[table] = rows;
    total += rows;
  }
  return { counts, total };
}

export function describeCounts(counts: Record<string, number>): string {
  return BACKUP_TABLES.map((table) => `${counts[table] ?? 0} ${table.replace('_', ' ')}`).join(', ');
}

// Mirrors the server-side validation in /api/backup/import so the user gets a
// clear message before anything is sent.
function assertServerBackup(data: unknown): ServerBackup {
  if (!data || typeof data !== 'object') {
    throw new Error('Not a valid backup file');
  }
  const backup = data as ServerBackup;
  if (backup.version !== 1) {
    throw new Error('Unsupported backup version (expected version 1)');
  }
  if (backup.scope && backup.scope !== 'server') {
    throw new Error('This is a local device snapshot and cannot be restored to the server');
  }
  if (!backup.tables || typeof backup.tables !== 'object') {
    throw new Error('Invalid backup file: missing tables');
  }
  const missing = BACKUP_TABLES.filter((table) => !Array.isArray(backup.tables[table]));
  if (missing.length > 0) {
    throw new Error(`Invalid backup file: missing tables ${missing.join(', ')}`);
  }
  return backup;
}

// Downloads a full JSON backup from the server and opens the system share
// sheet so the file can be saved to Files/Drive or sent elsewhere.
export async function exportServerBackup(userId: number): Promise<void> {
  const backup = await rawRequest<ServerBackup>(
    `/api/backup/export?userId=${userId}`,
    undefined,
    30000
  );
  assertServerBackup(backup);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }

  const fileName = `sneaker-lounge-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(backup, null, 2));

  try {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export backup',
    });
  } finally {
    if (file.exists) file.delete();
  }
}

// Opens the system file picker, reads the selected file, and validates it
// before returning. Throws BackupCancelledError if the user backs out.
export async function pickBackupFile(): Promise<{ backup: ServerBackup; counts: BackupCounts }> {
  const result = await File.pickFileAsync();

  if (result.canceled || !result.result) {
    throw new BackupCancelledError();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await result.result.text());
  } catch {
    throw new Error('Selected file is not valid JSON');
  }

  const backup = assertServerBackup(parsed);
  return { backup, counts: countBackupRows(backup) };
}

// Replaces ALL server data with the supplied backup. Admin-only (the server
// enforces the role check; this is a UX passthrough).
export async function importServerBackup(
  userId: number,
  backup: ServerBackup
): Promise<Record<string, number>> {
  const response = await rawRequest<{ success: boolean; counts?: Record<string, number> }>(
    `/api/backup/import?userId=${userId}`,
    {
      method: 'POST',
      body: JSON.stringify(backup),
    },
    60000
  );
  return response.counts ?? {};
}
