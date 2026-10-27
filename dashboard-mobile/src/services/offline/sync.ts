import { ApiError, isNetworkError, rawRequest } from '../http';
import { isOnline } from './network';
import {
  applyPullData,
  cacheSet,
  deleteOutbox,
  getMeta,
  getServerId,
  listPendingOutbox,
  markOutboxFailed,
  markOutboxRetry,
  offlineStorageReady,
  outboxCounts,
  remapLocalId,
  retryFailedOutbox,
  setMeta,
  type Row,
} from './repository';

export interface OfflineUser {
  id: number;
  role: string;
}

export interface SyncResult {
  sent: number;
  failed: number;
}

let flushing = false;
let pulling = false;
let pullTimer: ReturnType<typeof setTimeout> | null = null;

const REFERENCE_KEYS: Record<string, string> = {
  itemId: 'items',
  eventId: 'events',
  activityId: 'events',
  branchId: 'branches',
  toBranchId: 'branches',
  relatedEventId: 'events',
  relatedItemId: 'items',
};
const TABLES_WITH_NEGATIVE_IDS = new Set(['items', 'events', 'branches', 'categories']);

function isNegativeId(value: unknown): boolean {
  return typeof value === 'number' || (typeof value === 'string' && /^-\d+$/.test(value));
}

async function resolveReferences(value: unknown, idEntity?: string): Promise<unknown> {
  if (Array.isArray(value)) {
    return Promise.all(value.map((entry) => resolveReferences(entry, idEntity)));
  }

  if (value && typeof value === 'object') {
    const output: Row = {};

    for (const [key, entry] of Object.entries(value as Row)) {
      const entity = key === 'id' && idEntity ? idEntity : REFERENCE_KEYS[key];

      if (entity && isNegativeId(entry)) {
        const localId = Number(entry);
        const serverId = await getServerId(entity, localId);
        if (serverId == null) {
          throw new Error(`Cannot sync: unresolved offline ${entity} id ${localId}`);
        }
        output[key] = serverId;
        continue;
      }

      output[key] = await resolveReferences(entry, idEntity);
    }

    return output;
  }

  return value;
}

async function resolvePath(path: string): Promise<string> {
  const match = path.match(/^\/api\/(items|events)\/(-?\d+)$/);
  if (!match) return path;

  const entity = match[1];
  const localId = Number(match[2]);
  if (localId >= 0) return path;

  const serverId = await getServerId(entity, localId);
  if (serverId == null) {
    throw new Error(`Cannot sync: unresolved offline ${entity} id ${localId}`);
  }
  return `/api/${entity}/${serverId}`;
}

function extractCreatedId(entity: string, response: Row | null): number | null {
  if (!response) return null;

  const toNumber = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  switch (entity) {
    case 'items':
      return toNumber(response.item?.id);
    case 'events':
      return toNumber(response.event?.id ?? response.activity?.[0]?.id);
    case 'branches':
      return toNumber(response.branch?.id);
    case 'categories':
      return toNumber(response.category?.id);
    case 'performance':
      return toNumber(response.performance?.[0]?.id);
    default:
      return null;
  }
}

export async function flushOutbox(): Promise<SyncResult> {
  if (!offlineStorageReady() || flushing) return { sent: 0, failed: 0 };

  flushing = true;
  const result: SyncResult = { sent: 0, failed: 0 };

  try {
    for (;;) {
      const entries = await listPendingOutbox(20);
      if (entries.length === 0) break;

      let stop = false;

      for (const entry of entries) {
        let rawBody: Row | undefined;
        try {
          rawBody = entry.body ? (JSON.parse(entry.body) as Row) : undefined;
        } catch {
          await markOutboxFailed(entry.id, 'Malformed queued request');
          result.failed += 1;
          continue;
        }

        const entity = rawBody?.__entity ? String(rawBody.__entity) : undefined;
        const localId =
          rawBody?.__localId !== undefined && rawBody?.__localId !== null
            ? Number(rawBody.__localId)
            : null;

        let body: Row | undefined;
        if (rawBody) {
          const { __entity, __localId, ...rest } = rawBody;
          body = rest;
        }

        const idEntity =
          entry.method === 'PUT' && entry.path.split('?')[0] === '/api/items'
            ? 'items'
            : undefined;

        try {
          const resolvedBody = body ? ((await resolveReferences(body, idEntity)) as Row) : undefined;
          const resolvedPath = await resolvePath(entry.path);

          const response = await rawRequest<Row>(
            resolvedPath,
            {
              method: entry.method,
              body: resolvedBody === undefined ? undefined : JSON.stringify(resolvedBody),
            },
            20000
          );

          if (
            entity &&
            localId !== null &&
            localId < 0 &&
            TABLES_WITH_NEGATIVE_IDS.has(entity)
          ) {
            const serverId = extractCreatedId(entity, response);
            if (serverId != null) {
              await remapLocalId(entity, localId, serverId);
            }
          }

          await deleteOutbox(entry.id);
          result.sent += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sync failed';

          if (error instanceof ApiError) {
            const permanent =
              error.status >= 400 &&
              error.status < 500 &&
              error.status !== 408 &&
              error.status !== 429;

            if (permanent) {
              await markOutboxFailed(entry.id, message);
              result.failed += 1;
              continue;
            }
          }

          if (isNetworkError(error)) {
            await markOutboxRetry(entry.id, message);
            stop = true;
            break;
          }

          await markOutboxRetry(entry.id, message);
          stop = true;
          break;
        }
      }

      if (stop || entries.length < 20) break;
    }
  } finally {
    flushing = false;
  }

  return result;
}

export async function pullAll(user: OfflineUser): Promise<void> {
  if (!offlineStorageReady() || pulling) return;

  pulling = true;
  try {
    const isAdmin = user.role.trim().toLowerCase() === 'admin';
    const dashboardPath = `/api/dashboard?userId=${user.id}`;
    const usersPath = isAdmin ? '/api/users' : `/api/users?userId=${user.id}`;
    const performancePath = isAdmin
      ? '/api/performance'
      : `/api/performance?userId=${user.id}`;
    const notificationsPath = `/api/notifications?user_id=${user.id}`;

    const [items, branches, categories, events, schedules, users, performance, notifications, dashboard] =
      await Promise.all([
        rawRequest<{ items: Row[] }>('/api/items', undefined, 20000),
        rawRequest<{ branches: Row[] }>('/api/branches', undefined, 20000),
        rawRequest<{ categories: Row[] }>('/api/categories', undefined, 20000),
        rawRequest<{ events: Row[]; eventItems?: Row[] }>(
          '/api/events?includeItems=true',
          undefined,
          30000
        ),
        rawRequest<{ schedules: Row[] }>('/api/schedules?raw=true', undefined, 20000),
        rawRequest<{ users: Row[] }>(usersPath, undefined, 20000),
        rawRequest<{ performance: Row[] }>(performancePath, undefined, 20000),
        rawRequest<{ notifications: Row[] }>(notificationsPath, undefined, 20000),
        rawRequest<Row>(dashboardPath, undefined, 20000),
      ]);

    await applyPullData({
      branches: branches.branches ?? [],
      users: users.users ?? [],
      categories: categories.categories ?? [],
      items: items.items ?? [],
      events: events.events ?? [],
      event_items: events.eventItems ?? [],
      schedules: schedules.schedules ?? [],
      performance: performance.performance ?? [],
      notifications: notifications.notifications ?? [],
    });

    await Promise.all([
      cacheSet('/api/items', items),
      cacheSet('/api/branches', branches),
      cacheSet('/api/categories', categories),
      cacheSet(usersPath, users),
      cacheSet(performancePath, performance),
      cacheSet(notificationsPath, notifications),
      cacheSet(dashboardPath, dashboard),
      cacheSet('/api/dashboard', dashboard),
    ]);

    await setMeta('lastSyncedAt', new Date().toISOString());
    await setMeta('scopedUserId', String(user.id));
  } finally {
    pulling = false;
  }
}

export async function fullSync(user: OfflineUser): Promise<SyncResult & { pulled: boolean }> {
  if (!offlineStorageReady()) return { sent: 0, failed: 0, pulled: false };

  if (!(await isOnline())) {
    return { sent: 0, failed: 0, pulled: false };
  }

  const flushed = await flushOutbox();

  try {
    await pullAll(user);
    return { ...flushed, pulled: true };
  } catch {
    return { ...flushed, pulled: false };
  }
}

export function schedulePull(user: OfflineUser) {
  if (pullTimer) clearTimeout(pullTimer);
  pullTimer = setTimeout(() => {
    pullTimer = null;
    fullSync(user).catch(() => undefined);
  }, 1500);
}

export async function getSyncStatus() {
  if (!offlineStorageReady()) {
    return { pending: 0, failed: 0, lastSyncedAt: null as string | null };
  }

  const [counts, lastSyncedAt] = await Promise.all([
    outboxCounts(),
    getMeta('lastSyncedAt'),
  ]);

  return { ...counts, lastSyncedAt };
}

export async function retryFailedChanges(): Promise<void> {
  if (!offlineStorageReady()) return;
  await retryFailedOutbox();
}
