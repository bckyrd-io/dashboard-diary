import {
  cacheGet,
  getActivities,
  getBranches,
  getCategories,
  getEventDetail,
  getEvents,
  getItem,
  getItems,
  getNotifications,
  getPerformance,
  getSchedules,
  getUsers,
  offlineStorageReady,
} from './repository';

interface ResolveResult {
  found: boolean;
  data?: unknown;
}

function parseQuery(query: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!query) return params;

  for (const pair of query.split('&')) {
    if (!pair) continue;
    const [rawKey, rawValue = ''] = pair.split('=');
    try {
      params[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
    } catch {
      params[rawKey] = rawValue;
    }
  }
  return params;
}

// Serves a GET from the SQLite mirror / snapshot cache when the network is
// unavailable. Returns `found: false` when nothing local can answer the request.
export async function resolveOfflineGet(path: string): Promise<ResolveResult> {
  if (!offlineStorageReady()) return { found: false };

  const [pathname, queryString = ''] = path.split('?');
  const query = parseQuery(queryString);

  try {
    if (pathname === '/api/items') {
      return {
        found: true,
        data: await getItems({
          category: query.category,
          subCategory: query.sub_category,
          branchId: query.branch_id,
          search: query.search,
        }),
      };
    }

    const itemMatch = pathname.match(/^\/api\/items\/(-?\d+)$/);
    if (itemMatch) {
      const item = await getItem(Number(itemMatch[1]));
      if (item) return { found: true, data: item };
      return { found: true, data: { success: false, message: 'Item not found' } };
    }

    if (pathname === '/api/branches') {
      return { found: true, data: await getBranches() };
    }

    if (pathname === '/api/categories') {
      return { found: true, data: await getCategories() };
    }

    if (pathname === '/api/users') {
      const userId = query.userId ? Number(query.userId) : null;
      return { found: true, data: await getUsers(userId) };
    }

    if (pathname === '/api/activities') {
      return { found: true, data: await getActivities() };
    }

    if (pathname === '/api/events') {
      return {
        found: true,
        data: await getEvents({
          eventType: query.event_type,
          branchId: query.branch_id,
          includeItems: query.includeItems === 'true',
        }),
      };
    }

    const eventMatch = pathname.match(/^\/api\/events\/(-?\d+)$/);
    if (eventMatch) {
      const event = await getEventDetail(Number(eventMatch[1]));
      if (event) return { found: true, data: event };
      return { found: true, data: { success: false, message: 'Event not found' } };
    }

    if (pathname === '/api/schedules') {
      return { found: true, data: await getSchedules(query.raw !== 'true') };
    }

    if (pathname === '/api/notifications') {
      return {
        found: true,
        data: await getNotifications({
          userId: query.user_id ? Number(query.user_id) : null,
          unreadOnly: query.unread_only === 'true',
        }),
      };
    }

    if (pathname === '/api/performance') {
      return {
        found: true,
        data: await getPerformance(query.userId ? Number(query.userId) : null),
      };
    }

    if (pathname === '/api/dashboard') {
      const cached = await cacheGet(path);
      if (cached) return { found: true, data: cached };

      // The calendar screen reads schedule notifications from this endpoint
      // without a userId; rebuild that slice locally.
      const schedules = await getSchedules(false);
      const rows = (schedules as { schedules?: Array<Record<string, unknown>> }).schedules ?? [];
      return {
        found: true,
        data: {
          activitiesByType: [],
          activitiesList: [],
          notifications: rows.map((row) => ({
            notificationMessage: row.notificationMessage ?? null,
          })),
        },
      };
    }

    const cached = await cacheGet(path);
    if (cached) return { found: true, data: cached };
  } catch {
    return { found: false };
  }

  return { found: false };
}
