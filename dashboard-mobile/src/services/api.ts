// API Service - connects to the Next.js backend.
// Requests are network-first; reads fall back to the SQLite mirror and writes
// that fail because the device is offline are applied locally and queued in the
// outbox for replay when connectivity returns.
import { isNetworkError, makeClientOpId, rawRequest } from './http';
import { resolveOfflineGet } from './offline/resolve';
import {
  cacheSet,
  enqueueOutbox,
  offlineStorageReady,
} from './offline/repository';
import * as local from './offline/localMutations';
import { schedulePull, type OfflineUser, type SyncResult } from './offline/sync';

let syncUser: OfflineUser | null = null;

export function setSyncUser(user: OfflineUser | null) {
  syncUser = user;
}

function queueable(method: string, path: string): boolean {
  const clean = path.split('?')[0];

  if (method === 'POST') {
    return [
      '/api/items',
      '/api/categories',
      '/api/branches',
      '/api/checkout',
      '/api/events',
      '/api/activities',
      '/api/performance',
    ].includes(clean);
  }

  if (method === 'PUT') {
    return clean === '/api/items' || /^\/api\/events\/-?\d+$/.test(clean);
  }

  if (method === 'DELETE') {
    return /^\/api\/items\/-?\d+$/.test(clean) || /^\/api\/events\/-?\d+$/.test(clean);
  }

  return false;
}

interface LocalOutcome {
  result: any;
  queue: { entity: string; localId: number } | null;
}

async function applyLocalMutation(
  method: string,
  path: string,
  body: any
): Promise<LocalOutcome> {
  const clean = path.split('?')[0];

  if (method === 'POST' && clean === '/api/items') {
    const result = await local.createItemLocal(body);
    return { result, queue: { entity: 'items', localId: Number(result.item.id) } };
  }

  if (method === 'POST' && clean === '/api/categories') {
    const result = await local.createCategoryLocal(body);
    return {
      result,
      queue: result.duplicate ? null : { entity: 'categories', localId: Number(result.category.id) },
    };
  }

  if (method === 'POST' && clean === '/api/branches') {
    const result = await local.createBranchLocal(body);
    return { result, queue: { entity: 'branches', localId: Number(result.branch.id) } };
  }

  if (method === 'POST' && clean === '/api/checkout') {
    const result = await local.createCheckoutLocal(body, String(body.clientOpId));
    return { result, queue: { entity: 'events', localId: Number(result.event.id) } };
  }

  if (method === 'POST' && clean === '/api/events') {
    const result = await local.createEventLocal(body, String(body.clientOpId));
    return { result, queue: { entity: 'events', localId: Number(result.event.id) } };
  }

  if (method === 'POST' && clean === '/api/activities') {
    const result = await local.createActivityLocal(body, String(body.clientOpId));
    return { result, queue: { entity: 'events', localId: Number(result.activity[0].id) } };
  }

  if (method === 'POST' && clean === '/api/performance') {
    const result = await local.createPerformanceLocal(body);
    return {
      result,
      queue: result.duplicate
        ? null
        : { entity: 'performance', localId: Number(result.performance[0].id) },
    };
  }

  if (method === 'PUT' && clean === '/api/items') {
    const result = await local.updateItemLocal(body);
    return { result, queue: null };
  }

  const itemMatch = clean.match(/^\/api\/items\/(-?\d+)$/);
  if (method === 'DELETE' && itemMatch) {
    const result = await local.deleteItemLocal(Number(itemMatch[1]));
    return { result, queue: null };
  }

  const eventMatch = clean.match(/^\/api\/events\/(-?\d+)$/);
  if (eventMatch) {
    const eventId = Number(eventMatch[1]);
    if (method === 'PUT') {
      return { result: await local.updateSaleLocal(eventId, body), queue: null };
    }
    if (method === 'DELETE') {
      return { result: await local.deleteSaleLocal(eventId), queue: null };
    }
  }

  throw new Error('This action needs a connection');
}

async function mutate<T>(method: string, path: string, body?: unknown): Promise<T> {
  try {
    const data = await rawRequest<T>(path, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (syncUser) schedulePull(syncUser);
    return data;
  } catch (error) {
    if (
      !isNetworkError(error) ||
      !offlineStorageReady() ||
      !queueable(method, path)
    ) {
      throw error;
    }

    const clientOpId = method === 'POST' ? makeClientOpId() : null;
    const enrichedBody =
      clientOpId && body && typeof body === 'object'
        ? { ...(body as Record<string, unknown>), clientOpId }
        : body;

    const outcome = await applyLocalMutation(method, path, enrichedBody);

    if (outcome.queue) {
      await enqueueOutbox({
        method,
        path,
        body: {
          ...(enrichedBody as Record<string, unknown>),
          __entity: outcome.queue.entity,
          __localId: outcome.queue.localId,
        },
        clientOpId,
      });
    } else if (!(outcome.result as { skipQueue?: boolean }).skipQueue) {
      await enqueueOutbox({ method, path, body: enrichedBody, clientOpId });
    }

    return { ...(outcome.result as Record<string, unknown>), offline: true } as T;
  }
}

export const api = {
  get: async <T>(path: string): Promise<T> => {
    try {
      const data = await rawRequest<T>(path);

      if (offlineStorageReady()) {
        cacheSet(path, data).catch(() => undefined);
      }

      return data;
    } catch (error) {
      if (isNetworkError(error) && offlineStorageReady()) {
        const resolved = await resolveOfflineGet(path);
        if (resolved.found) return resolved.data as T;
      }
      throw error;
    }
  },
  post: <T>(path: string, body: unknown) => mutate<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => mutate<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => mutate<T>('PATCH', path, body),
  delete: <T>(path: string, body?: unknown) => mutate<T>('DELETE', path, body),
};

export type { SyncResult };
