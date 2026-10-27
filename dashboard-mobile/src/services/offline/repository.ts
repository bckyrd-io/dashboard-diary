import { getOfflineDb, isOfflineDbAvailable } from './db';
import { TABLE_COLUMNS } from './schema';

export type Row = Record<string, any>;

export interface OutboxEntry {
  id: number;
  method: string;
  path: string;
  body: string | null;
  clientOpId: string | null;
  attempts: number;
  state: 'pending' | 'failed';
  lastError: string | null;
  createdAt: string;
}

export function offlineStorageReady(): boolean {
  return isOfflineDbAvailable();
}

function normalize(value: unknown): unknown {
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value;
}

async function replaceRowsInner(
  db: Awaited<ReturnType<typeof getOfflineDb>>,
  table: string,
  rows: Row[]
) {
  const columns = TABLE_COLUMNS[table];
  if (!columns) throw new Error(`Unknown offline table: ${table}`);

  await db.runAsync(`DELETE FROM ${table}`);

  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

  for (const row of rows) {
    await db.runAsync(
      sql,
      columns.map((column) => normalize(row[column]))
    );
  }
}

export async function replaceTableRows(table: string, rows: Row[]) {
  const db = await getOfflineDb();
  await db.withTransactionAsync(() => replaceRowsInner(db, table, rows));
}

export async function applyPullData(data: Partial<Record<string, Row[]>>) {
  const db = await getOfflineDb();
  await db.withTransactionAsync(async () => {
    for (const table of Object.keys(TABLE_COLUMNS)) {
      if (Array.isArray(data[table])) {
        await replaceRowsInner(db, table, data[table] as Row[]);
      }
    }
  });
}

// ---------------------------------------------------------------- reads

export async function getItems(filters: {
  category?: string | null;
  subCategory?: string | null;
  branchId?: string | null;
  search?: string | null;
} = {}) {
  const db = await getOfflineDb();
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.category) {
    where.push('category = ?');
    params.push(filters.category);
  }
  if (filters.subCategory) {
    where.push('subCategory = ?');
    params.push(filters.subCategory);
  }
  if (filters.branchId) {
    where.push('branchId = ?');
    params.push(Number(filters.branchId));
  }
  if (filters.search) {
    where.push('LOWER(name) LIKE ?');
    params.push(`%${String(filters.search).toLowerCase()}%`);
  }

  const sql = `SELECT * FROM items${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY name COLLATE NOCASE`;
  const items = await db.getAllAsync<Row>(sql, params);
  return { success: true as const, items };
}

export async function getItem(id: number) {
  const db = await getOfflineDb();
  const item = await db.getFirstAsync<Row>('SELECT * FROM items WHERE id = ?', [id]);
  if (!item) return null;
  return { success: true as const, item };
}

export async function getBranches() {
  const db = await getOfflineDb();
  const branches = await db.getAllAsync<Row>(
    `SELECT b.id, b.name, b.location,
       (SELECT COUNT(*) FROM items i WHERE i.branchId = b.id) AS itemCount
     FROM branches b
     ORDER BY b.name COLLATE NOCASE`
  );
  return { success: true as const, branches };
}

export async function getCategories() {
  const db = await getOfflineDb();
  const categories = await db.getAllAsync<Row>(
    'SELECT * FROM categories ORDER BY name COLLATE NOCASE'
  );
  return { success: true as const, categories };
}

export async function getUsers(userId?: number | null) {
  const db = await getOfflineDb();
  const users = userId
    ? await db.getAllAsync<Row>('SELECT * FROM users WHERE id = ?', [userId])
    : await db.getAllAsync<Row>('SELECT * FROM users ORDER BY username COLLATE NOCASE');
  return { success: true as const, users };
}

export async function getEvents(filters: {
  eventType?: string | null;
  branchId?: string | null;
  includeItems?: boolean;
} = {}) {
  const db = await getOfflineDb();
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.eventType) {
    where.push('eventType = ?');
    params.push(filters.eventType);
  }
  if (filters.branchId) {
    where.push('(branchId = ? OR toBranchId = ?)');
    params.push(Number(filters.branchId), Number(filters.branchId));
  }

  const events = await db.getAllAsync<Row>(
    `SELECT * FROM events${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY id DESC`,
    params
  );

  if (filters.includeItems) {
    const eventItems = await db.getAllAsync<Row>('SELECT * FROM event_items');
    return { success: true as const, events, eventItems };
  }

  return { success: true as const, events };
}

export async function getEventDetail(id: number) {
  const db = await getOfflineDb();
  const event = await db.getFirstAsync<Row>('SELECT * FROM events WHERE id = ?', [id]);
  if (!event) return null;

  const items = await db.getAllAsync<Row>(
    `SELECT ei.id, ei.eventId, ei.itemId, ei.quantity, ei.unitPriceAtSale,
            i.name AS itemName, i.barcode AS itemBarcode, i.imageUrl AS itemImage
     FROM event_items ei
     LEFT JOIN items i ON i.id = ei.itemId
     WHERE ei.eventId = ?`,
    [id]
  );

  return { success: true as const, event: { ...event, items } };
}

export async function getActivities() {
  const db = await getOfflineDb();
  const activities = await db.getAllAsync<Row>('SELECT * FROM events ORDER BY id DESC');
  return { success: true as const, activities };
}

export async function getSchedules(calendar: boolean) {
  const db = await getOfflineDb();

  if (!calendar) {
    const schedules = await db.getAllAsync<Row>('SELECT * FROM schedules');
    return { success: true as const, schedules };
  }

  const rows = await db.getAllAsync<Row>(
    `SELECT s.id AS scheduleId, s.scheduledDate, e.description AS activityDescription
     FROM schedules s
     LEFT JOIN events e ON e.id = s.activityId`
  );

  const events = rows.map((row) => ({
    id: row.scheduleId != null ? String(row.scheduleId) : '',
    title: row.activityDescription ?? 'Untitled Activity',
    start: row.scheduledDate ? new Date(row.scheduledDate).toISOString() : '',
  }));

  return { success: true as const, events, total: events.length };
}

export async function getNotifications(filters: {
  userId?: number | null;
  unreadOnly?: boolean;
} = {}) {
  const db = await getOfflineDb();
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.userId) {
    where.push('userId = ?');
    params.push(filters.userId);
  }
  if (filters.unreadOnly) {
    where.push('isRead = 0');
  }

  const notifications = await db.getAllAsync<Row>(
    `SELECT * FROM notifications${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY id DESC`,
    params
  );
  return { success: true as const, notifications };
}

export async function getPerformance(userId?: number | null) {
  const db = await getOfflineDb();
  const params: unknown[] = [];
  let where = `u.role = 'Staff'`;

  if (userId) {
    where += ' AND u.id = ?';
    params.push(userId);
  }

  const performance = await db.getAllAsync<Row>(
    `SELECT p.id, u.id AS userId, u.username, b.name AS branch_name, u.role,
            e.description AS activity, p.status, p.updatedAt
     FROM users u
     LEFT JOIN performance p ON u.id = p.userId
     LEFT JOIN branches b ON u.branchId = b.id
     LEFT JOIN events e ON p.activityId = e.id
     WHERE ${where}
     ORDER BY u.username COLLATE NOCASE`,
    params
  );

  return { success: true as const, performance };
}

// ---------------------------------------------------------------- api cache

export async function cacheSet(url: string, body: unknown) {
  const db = await getOfflineDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO api_cache (url, body, updatedAt) VALUES (?, ?, ?)',
    [url, JSON.stringify(body), new Date().toISOString()]
  );
}

export async function cacheGet<T = unknown>(url: string): Promise<T | null> {
  const db = await getOfflineDb();
  const row = await db.getFirstAsync<{ body: string }>(
    'SELECT body FROM api_cache WHERE url = ?',
    [url]
  );
  if (!row) return null;
  try {
    return JSON.parse(row.body) as T;
  } catch {
    return null;
  }
}

export async function cacheClear() {
  const db = await getOfflineDb();
  await db.runAsync('DELETE FROM api_cache');
}

// ---------------------------------------------------------------- meta

export async function getMeta(key: string): Promise<string | null> {
  const db = await getOfflineDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM sync_meta WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string) {
  const db = await getOfflineDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
    [key, value]
  );
}

// ---------------------------------------------------------------- outbox

export async function enqueueOutbox(op: {
  method: string;
  path: string;
  body: unknown;
  clientOpId?: string | null;
}) {
  const db = await getOfflineDb();
  await db.runAsync(
    `INSERT INTO outbox (method, path, body, clientOpId, attempts, state, createdAt)
     VALUES (?, ?, ?, ?, 0, 'pending', ?)`,
    [
      op.method,
      op.path,
      op.body === undefined ? null : JSON.stringify(op.body),
      op.clientOpId ?? null,
      new Date().toISOString(),
    ]
  );
}

export async function listPendingOutbox(limit = 100): Promise<OutboxEntry[]> {
  const db = await getOfflineDb();
  return db.getAllAsync<OutboxEntry>(
    `SELECT * FROM outbox WHERE state = 'pending' ORDER BY id ASC LIMIT ${Number(limit)}`
  );
}

export async function markOutboxFailed(id: number, error: string) {
  const db = await getOfflineDb();
  await db.runAsync(
    `UPDATE outbox SET state = 'failed', attempts = attempts + 1, lastError = ? WHERE id = ?`,
    [error, id]
  );
}

export async function markOutboxRetry(id: number, error: string) {
  const db = await getOfflineDb();
  await db.runAsync(
    `UPDATE outbox SET attempts = attempts + 1, lastError = ? WHERE id = ?`,
    [error, id]
  );
}

export async function deleteOutbox(id: number) {
  const db = await getOfflineDb();
  await db.runAsync('DELETE FROM outbox WHERE id = ?', [id]);
}

export async function retryFailedOutbox() {
  const db = await getOfflineDb();
  await db.runAsync(`UPDATE outbox SET state = 'pending', lastError = NULL WHERE state = 'failed'`);
}

export async function outboxCounts() {
  const db = await getOfflineDb();
  const row = await db.getFirstAsync<{ pending: number; failed: number }>(
    `SELECT
       SUM(CASE WHEN state = 'pending' THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN state = 'failed' THEN 1 ELSE 0 END) AS failed
     FROM outbox`
  );
  return { pending: Number(row?.pending ?? 0), failed: Number(row?.failed ?? 0) };
}

export async function pendingCreateBody(clientOpId: string): Promise<Row | null> {
  const db = await getOfflineDb();
  const row = await db.getFirstAsync<{ id: number; body: string | null }>(
    `SELECT id, body FROM outbox WHERE clientOpId = ? AND state = 'pending' ORDER BY id ASC LIMIT 1`,
    [clientOpId]
  );
  if (!row || !row.body) return null;
  try {
    return JSON.parse(row.body) as Row;
  } catch {
    return null;
  }
}

export async function updatePendingCreateBody(clientOpId: string, body: Row) {
  const db = await getOfflineDb();
  await db.runAsync(`UPDATE outbox SET body = ? WHERE clientOpId = ? AND state = 'pending'`, [
    JSON.stringify(body),
    clientOpId,
  ]);
}

export async function removePendingCreate(clientOpId: string) {
  const db = await getOfflineDb();
  await db.runAsync(`DELETE FROM outbox WHERE clientOpId = ? AND state = 'pending'`, [clientOpId]);
}

// ---------------------------------------------------------------- id map

export async function setServerId(entity: string, localId: number, serverId: number) {
  const db = await getOfflineDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO id_map (entity, localId, serverId) VALUES (?, ?, ?)',
    [entity, localId, serverId]
  );
}

export async function getServerId(entity: string, localId: number): Promise<number | null> {
  if (localId >= 0) return localId;
  const db = await getOfflineDb();
  const row = await db.getFirstAsync<{ serverId: number }>(
    'SELECT serverId FROM id_map WHERE entity = ? AND localId = ?',
    [entity, localId]
  );
  return row ? Number(row.serverId) : null;
}

export async function nextTempId(table: string): Promise<number> {
  const db = await getOfflineDb();
  const row = await db.getFirstAsync<{ minId: number | null }>(
    `SELECT MIN(id) AS minId FROM ${table}`
  );
  const minId = row?.minId;
  if (minId == null) return -1;
  return minId < 0 ? Number(minId) - 1 : -1;
}

// ---------------------------------------------------------------- id remap

export async function remapLocalId(entity: string, localId: number, serverId: number) {
  const db = await getOfflineDb();

  const updates: Record<string, string[]> = {
    items: [
      'UPDATE OR REPLACE items SET id = ?2 WHERE id = ?1',
      'UPDATE event_items SET itemId = ?2 WHERE itemId = ?1',
      'UPDATE notifications SET relatedItemId = ?2 WHERE relatedItemId = ?1',
    ],
    events: [
      'UPDATE OR REPLACE events SET id = ?2 WHERE id = ?1',
      'UPDATE event_items SET eventId = ?2 WHERE eventId = ?1',
      'UPDATE schedules SET activityId = ?2 WHERE activityId = ?1',
      'UPDATE performance SET activityId = ?2 WHERE activityId = ?1',
      'UPDATE notifications SET relatedEventId = ?2 WHERE relatedEventId = ?1',
    ],
    branches: [
      'UPDATE OR REPLACE branches SET id = ?2 WHERE id = ?1',
      'UPDATE users SET branchId = ?2 WHERE branchId = ?1',
      'UPDATE items SET branchId = ?2 WHERE branchId = ?1',
      'UPDATE events SET branchId = ?2 WHERE branchId = ?1',
      'UPDATE events SET toBranchId = ?2 WHERE toBranchId = ?1',
    ],
    users: [
      'UPDATE OR REPLACE users SET id = ?2 WHERE id = ?1',
      'UPDATE performance SET userId = ?2 WHERE userId = ?1',
      'UPDATE notifications SET userId = ?2 WHERE userId = ?1',
    ],
    categories: ['UPDATE OR REPLACE categories SET id = ?2 WHERE id = ?1'],
  };

  await db.withTransactionAsync(async () => {
    for (const statement of updates[entity] ?? []) {
      await db.runAsync(statement, [localId, serverId]);
    }
    await db.runAsync(
      'INSERT OR REPLACE INTO id_map (entity, localId, serverId) VALUES (?, ?, ?)',
      [entity, localId, serverId]
    );
  });
}

// ---------------------------------------------------------------- export / reset

export async function exportLocalTables(): Promise<Record<string, Row[]>> {
  const db = await getOfflineDb();
  const tables: Record<string, Row[]> = {};
  for (const table of Object.keys(TABLE_COLUMNS)) {
    tables[table] = await db.getAllAsync<Row>(`SELECT * FROM ${table}`);
  }
  return tables;
}

export async function clearOfflineData() {
  const db = await getOfflineDb();
  await db.withTransactionAsync(async () => {
    for (const table of Object.keys(TABLE_COLUMNS)) {
      await db.runAsync(`DELETE FROM ${table}`);
    }
    await db.runAsync('DELETE FROM outbox');
    await db.runAsync('DELETE FROM id_map');
    await db.runAsync('DELETE FROM api_cache');
    await db.runAsync('DELETE FROM sync_meta');
  });
}
