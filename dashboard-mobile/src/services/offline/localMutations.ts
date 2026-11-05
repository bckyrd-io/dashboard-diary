import { getOfflineDb } from './db';
import { TABLE_COLUMNS } from './schema';
import {
  nextTempId,
  pendingCreateBody,
  removePendingCreate,
  updatePendingCreateBody,
  type Row,
} from './repository';

async function insertRow(table: string, row: Row) {
  const columns = TABLE_COLUMNS[table];
  if (!columns) throw new Error(`Unknown table: ${table}`);
  const db = await getOfflineDb();
  const values = columns.map((column) => {
    const value = row[column];
    if (value === undefined) return null;
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value;
  });
  await db.runAsync(
    `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    values
  );
}

async function updateRow(table: string, id: number, patch: Row) {
  const columns = TABLE_COLUMNS[table] ?? [];
  const entries = Object.entries(patch).filter(([key]) => key !== 'id' && columns.includes(key));
  if (entries.length === 0) return;
  const db = await getOfflineDb();
  const assignments = entries.map(([key]) => `${key} = ?`).join(', ');
  await db.runAsync(`UPDATE ${table} SET ${assignments} WHERE id = ?`, [
    ...entries.map(([, value]) => (typeof value === 'boolean' ? (value ? 1 : 0) : value ?? null)),
    id,
  ]);
}

async function findRow(table: string, id: number): Promise<Row | null> {
  const db = await getOfflineDb();
  return db.getFirstAsync<Row>(`SELECT * FROM ${table} WHERE id = ?`, [id]);
}

// Offline twin of the server's StockError: thrown BEFORE any row is written,
// so nothing is queued to the outbox and the UI shows a clear message.
export class LocalStockError extends Error {
  status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.name = 'LocalStockError';
    this.status = status;
  }
}

/**
 * Validate stock lines against the local mirror before applying a mutation.
 * `restore` lists quantities that the same operation is about to add back
 * (e.g. the old lines of a sale being edited), which count as available.
 */
async function assertLocalStock(
  lines: Row[],
  opts: { branchId?: number | null; restore?: Row[] } = {}
) {
  const needed = new Map<number, number>();
  for (const line of lines) {
    const itemId = Number(line.itemId);
    const qty = Number(line.quantity);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      throw new LocalStockError('Invalid item in request', 400);
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new LocalStockError('Quantities must be positive whole numbers', 400);
    }
    needed.set(itemId, (needed.get(itemId) ?? 0) + qty);
  }

  const restored = new Map<number, number>();
  for (const line of opts.restore ?? []) {
    const itemId = Number(line.itemId);
    restored.set(itemId, (restored.get(itemId) ?? 0) + Number(line.quantity));
  }

  const db = await getOfflineDb();
  for (const [itemId, qty] of needed) {
    const row = await db.getFirstAsync<Row>('SELECT * FROM items WHERE id = ?', [itemId]);
    if (!row) throw new LocalStockError('One of the items no longer exists', 400);
    if (opts.branchId != null && Number(row.branchId) !== Number(opts.branchId)) {
      throw new LocalStockError(`"${row.name}" is not stocked at the selected branch`, 400);
    }
    const available = Number(row.quantity ?? 0) + (restored.get(itemId) ?? 0);
    if (available < qty) {
      throw new LocalStockError(
        available <= 0
          ? `Insufficient stock: "${row.name}" is out of stock`
          : `Insufficient stock: "${row.name}" has only ${available} available (requested ${qty})`
      );
    }
  }
}

async function adjustStock(itemId: number, delta: number) {
  const db = await getOfflineDb();
  if (delta < 0) {
    // Guarded: the UPDATE only applies while the balance would stay >= 0,
    // mirroring the server-side WHERE quantity >= n predicate.
    const result = await db.runAsync(
      'UPDATE items SET quantity = COALESCE(quantity, 0) + ? WHERE id = ? AND COALESCE(quantity, 0) + ? >= 0',
      [delta, itemId, delta]
    );
    if (result.changes === 0) {
      const row = await db.getFirstAsync<Row>('SELECT name, quantity FROM items WHERE id = ?', [itemId]);
      if (!row) throw new LocalStockError('One of the items no longer exists', 400);
      throw new LocalStockError(
        Number(row.quantity ?? 0) <= 0
          ? `Insufficient stock: "${row.name}" is out of stock`
          : `Insufficient stock: "${row.name}" has only ${Number(row.quantity ?? 0)} available`
      );
    }
    return;
  }
  await db.runAsync('UPDATE items SET quantity = COALESCE(quantity, 0) + ? WHERE id = ?', [
    delta,
    itemId,
  ]);
}

const nowIso = () => new Date().toISOString();
const today = () => new Date().toISOString().split('T')[0];

// ------------------------------------------------------------------ items

export async function createItemLocal(payload: Row) {
  const id = await nextTempId('items');
  const timestamp = nowIso();
  const item: Row = {
    id,
    name: payload.name,
    category: payload.category || 'physical-product',
    subCategory: payload.subCategory ?? null,
    barcode: payload.barcode ?? null,
    sku: payload.sku ?? null,
    price: Number(payload.price) || 0,
    costPrice: payload.costPrice != null && payload.costPrice !== '' ? Number(payload.costPrice) : null,
    quantity: Number(payload.quantity) || 0,
    unit: payload.unit ?? null,
    reorderThreshold:
      payload.reorderThreshold != null && payload.reorderThreshold !== ''
        ? Number(payload.reorderThreshold)
        : null,
    imageUrl: payload.imageUrl ?? null,
    branchId: payload.branchId ? Number(payload.branchId) : null,
    clientOpId: payload.clientOpId ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await insertRow('items', item);
  return { success: true as const, item };
}

export async function updateItemLocal(payload: Row) {
  const id = Number(payload.id);
  const existing = await findRow('items', id);

  if (!existing) {
    throw new Error('Item not found');
  }

  if (id < 0 && existing.clientOpId) {
    // Fold the edit into the queued create so the server never sees a temp id.
    const queued = (await pendingCreateBody(String(existing.clientOpId))) ?? {};
    const merged = {
      ...queued,
      ...payload,
      id: undefined,
      clientOpId: existing.clientOpId,
      branchId:
        payload.branchId !== undefined
          ? payload.branchId
          : queued.branchId !== undefined
            ? queued.branchId
            : existing.branchId,
    };
    await updatePendingCreateBody(String(existing.clientOpId), merged);
  }

  const patch: Row = { ...payload, updatedAt: nowIso() };
  delete patch.id;
  await updateRow('items', id, patch);

  const updated = await findRow('items', id);
  return { success: true as const, item: updated, offline: true, skipQueue: id < 0 };
}

export async function deleteItemLocal(id: number) {
  const existing = await findRow('items', id);
  const wasLocalOnly = id < 0;

  if (existing?.clientOpId) {
    await removePendingCreate(String(existing.clientOpId));
  }

  const db = await getOfflineDb();
  await db.runAsync('DELETE FROM event_items WHERE itemId = ?', [id]);
  await db.runAsync('DELETE FROM items WHERE id = ?', [id]);

  return {
    success: true as const,
    message: 'Item deleted',
    offline: true,
    skipQueue: wasLocalOnly,
  };
}

// ------------------------------------------------------------------ categories / branches

export async function createCategoryLocal(payload: Row) {
  const name = String(payload.name ?? '').trim();
  if (!name) throw new Error('Category name is required');

  const db = await getOfflineDb();
  const existing = await db.getFirstAsync<Row>(
    'SELECT * FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1',
    [name]
  );

  if (existing) {
    return { success: true as const, category: existing, duplicate: true };
  }

  const category: Row = { id: await nextTempId('categories'), name, createdAt: nowIso() };
  await insertRow('categories', category);
  return { success: true as const, category, offline: true };
}

export async function createBranchLocal(payload: Row) {
  const branch: Row = {
    id: await nextTempId('branches'),
    name: String(payload.name ?? ''),
    location: String(payload.location ?? ''),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await insertRow('branches', branch);
  return {
    success: true as const,
    message: 'Branch created successfully',
    branch,
    offline: true,
  };
}

// ------------------------------------------------------------------ events

async function insertEventItems(eventId: number, items: Row[]) {
  for (const item of items ?? []) {
    await insertRow('event_items', {
      id: await nextTempId('event_items'),
      eventId,
      itemId: Number(item.itemId),
      quantity: Number(item.quantity) || 1,
      unitPriceAtSale: Number(item.unitPriceAtSale) || 0,
      createdAt: nowIso(),
    });
  }
}

async function applyEventStock(eventType: string, items: Row[], branchId?: number | null, toBranchId?: number | null) {
  if (eventType === 'sale') {
    for (const item of items) {
      await adjustStock(Number(item.itemId), -Number(item.quantity));
    }
    return;
  }

  if (eventType === 'receiving') {
    for (const item of items) {
      await adjustStock(Number(item.itemId), Number(item.quantity));
    }
    return;
  }

  if (eventType === 'transfer') {
    for (const item of items) {
      const itemId = Number(item.itemId);
      const quantity = Number(item.quantity);
      const source = await findRow('items', itemId);

      await adjustStock(itemId, -quantity);

      // Mirror the destination row when it already exists locally. If it does
      // not, the server will create it during replay and the next pull mirrors it.
      // Match on the normalized name so case/whitespace never forks a row.
      if (source?.name && toBranchId != null) {
        const db = await getOfflineDb();
        const destination = await db.getFirstAsync<Row>(
          'SELECT * FROM items WHERE branchId = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1',
          [toBranchId, source.name]
        );
        if (destination) {
          await adjustStock(Number(destination.id), quantity);
        }
      }
    }
  }
}

export async function createCheckoutLocal(payload: Row, clientOpId: string) {
  const items: Row[] = Array.isArray(payload.items) ? payload.items : [];

  // Validate stock BEFORE writing anything — a rejected sale must not leave
  // a half-written event or get queued to the outbox.
  await assertLocalStock(items);

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPriceAtSale || 0),
    0
  );

  const eventId = await nextTempId('events');
  const event: Row = {
    id: eventId,
    eventType: 'sale',
    financialType: 'Revenue',
    description: payload.description || `Sale - ${items.length} item(s)`,
    amount: totalAmount,
    date: today(),
    branchId: null,
    toBranchId: null,
    paymentMethod: payload.paymentMethod ?? null,
    paymentReference: payload.paymentReference ?? null,
    paymentStatus: 'success',
    isRecurring: 0,
    recurrenceRule: null,
    clientOpId,
    createdAt: nowIso(),
  };

  await insertRow('events', event);
  await insertEventItems(eventId, items);
  await applyEventStock('sale', items);

  if (payload.userId) {
    const db = await getOfflineDb();
    const existing = await db.getFirstAsync<Row>(
      'SELECT * FROM performance WHERE userId = ? AND activityId = ? LIMIT 1',
      [Number(payload.userId), eventId]
    );
    if (!existing) {
      await insertRow('performance', {
        id: await nextTempId('performance'),
        userId: Number(payload.userId),
        activityId: eventId,
        status: 'Completed',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }
  }

  return { success: true as const, event, offline: true, message: 'Sale queued for sync' };
}

export async function createEventLocal(payload: Row, clientOpId: string) {
  const items: Row[] = Array.isArray(payload.items) ? payload.items : [];

  // Validate before writing (sales need stock; transfers need the stock at
  // the source branch). Receiving only adds stock, so nothing to check.
  if (payload.eventType === 'sale') {
    await assertLocalStock(items);
  } else if (payload.eventType === 'transfer') {
    await assertLocalStock(items, { branchId: payload.branchId ? Number(payload.branchId) : null });
  }

  const eventId = await nextTempId('events');
  const computedAmount =
    Number(payload.amount) ||
    items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPriceAtSale || 0),
      0
    );

  const event: Row = {
    id: eventId,
    eventType: payload.eventType,
    financialType:
      payload.financialType || (payload.eventType === 'sale' ? 'Revenue' : 'Neutral'),
    description:
      payload.description ||
      (payload.eventType === 'transfer' ? 'Stock Transfer' : `${payload.eventType} event`),
    amount: computedAmount,
    date: payload.date || today(),
    branchId: payload.branchId ? Number(payload.branchId) : null,
    toBranchId: payload.toBranchId ? Number(payload.toBranchId) : null,
    paymentMethod: payload.paymentMethod ?? null,
    paymentReference: payload.paymentReference ?? null,
    paymentStatus: payload.paymentStatus ?? 'success',
    isRecurring: payload.isRecurring ? 1 : 0,
    recurrenceRule: payload.recurrenceRule ?? null,
    clientOpId,
    createdAt: nowIso(),
  };

  await insertRow('events', event);
  await insertEventItems(eventId, items);
  await applyEventStock(
    payload.eventType,
    items,
    event.branchId as number | null,
    event.toBranchId as number | null
  );

  // Calendar sync (mirrors POST /api/events): dated non-sale events show up
  // on Schedule screens; sales are history created by checkout.
  if (payload.eventType !== 'sale' && String(event.date) >= today()) {
    await insertRow('schedules', {
      id: await nextTempId('schedules'),
      activityId: eventId,
      scheduledDate: event.date,
      notificationMessage: `Upcoming: ${event.description}`,
      createdAt: nowIso(),
    });
  }

  return { success: true as const, event, offline: true };
}

export async function updateSaleLocal(eventId: number, payload: Row) {
  const existing = await findRow('events', eventId);
  if (!existing) throw new Error('Event not found');

  const db = await getOfflineDb();
  const oldItems = await db.getAllAsync<Row>('SELECT * FROM event_items WHERE eventId = ?', [
    eventId,
  ]);

  if (existing.eventType === 'sale') {
    // The old lines are about to be added back, so they count as available
    // stock for the new lines. Validate the whole edit before touching rows —
    // a rejected edit must not restore the old stock without deducting the new.
    const items: Row[] = Array.isArray(payload.items) ? payload.items : [];
    await assertLocalStock(items, { restore: oldItems });

    for (const item of oldItems) {
      await adjustStock(Number(item.itemId), Number(item.quantity));
    }

    for (const item of items) {
      await adjustStock(Number(item.itemId), -Number(item.quantity));
    }
  }

  const items: Row[] = Array.isArray(payload.items) ? payload.items : [];
  const totalAmount =
    items.length > 0
      ? items.reduce(
          (sum, item) => sum + Number(item.quantity) * Number(item.unitPriceAtSale || 0),
          0
        )
      : Number(existing.amount);

  await db.runAsync(
    `UPDATE events SET amount = ?, paymentMethod = COALESCE(?, paymentMethod),
       description = COALESCE(?, description), paymentStatus = COALESCE(?, paymentStatus)
     WHERE id = ?`,
    [
      totalAmount,
      payload.paymentMethod ?? null,
      payload.description ?? (items.length ? `Sale - ${items.length} item(s)` : null),
      payload.paymentStatus ?? null,
      eventId,
    ]
  );

  if (items.length > 0) {
    await db.runAsync('DELETE FROM event_items WHERE eventId = ?', [eventId]);
    await insertEventItems(eventId, items);
  }

  const updated = await findRow('events', eventId);
  return { success: true as const, event: updated, offline: true };
}

export async function deleteSaleLocal(eventId: number) {
  const existing = await findRow('events', eventId);
  if (!existing) throw new Error('Event not found');

  const db = await getOfflineDb();
  const items = await db.getAllAsync<Row>('SELECT * FROM event_items WHERE eventId = ?', [
    eventId,
  ]);

  // Validate every revert BEFORE mutating: receiving/transfer reversals take
  // stock away, and a transfer revert must debit the destination row.
  if (existing.eventType === 'receiving') {
    await assertLocalStock(items);
  } else if (existing.eventType === 'transfer' && existing.toBranchId != null) {
    for (const item of items) {
      const src = await findRow('items', Number(item.itemId));
      if (!src?.name) continue;
      const destination = await db.getFirstAsync<Row>(
        'SELECT * FROM items WHERE branchId = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1',
        [Number(existing.toBranchId), src.name]
      );
      if (destination) {
        await assertLocalStock([{ itemId: Number(destination.id), quantity: Number(item.quantity) }]);
      }
    }
  }

  if (existing.eventType === 'sale') {
    for (const item of items) {
      await adjustStock(Number(item.itemId), Number(item.quantity));
    }
  } else if (existing.eventType === 'receiving') {
    for (const item of items) {
      await adjustStock(Number(item.itemId), -Number(item.quantity));
    }
  } else if (existing.eventType === 'transfer' && existing.toBranchId != null) {
    // Credit the source row (event line items point at it) and debit the
    // destination clone — otherwise the transferred stock stays double-counted.
    for (const item of items) {
      const itemId = Number(item.itemId);
      const quantity = Number(item.quantity);
      const src = await findRow('items', itemId);
      if (!src) continue;

      await adjustStock(itemId, quantity);

      if (src.name) {
        const destination = await db.getFirstAsync<Row>(
          'SELECT * FROM items WHERE branchId = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1',
          [Number(existing.toBranchId), src.name]
        );
        if (destination) {
          await adjustStock(Number(destination.id), -quantity);

          // Mirrors the server: an emptied destination clone is removed so the
          // product doesn't linger as a phantom "0 stock at branch X" row.
          // Rows with sales history are kept (event_items references them).
          const destId = Number(destination.id);
          const refs = await db.getFirstAsync<Row>(
            'SELECT 1 AS one FROM event_items WHERE itemId = ? LIMIT 1',
            [destId]
          );
          const after = await db.getFirstAsync<Row>('SELECT quantity FROM items WHERE id = ?', [destId]);
          if (!refs && Number(after?.quantity ?? 0) <= 0) {
            await db.runAsync('DELETE FROM items WHERE id = ?', [destId]);
          }
        }
      }
    }
  }

  await db.runAsync('DELETE FROM event_items WHERE eventId = ?', [eventId]);
  await db.runAsync('DELETE FROM schedules WHERE activityId = ?', [eventId]);
  await db.runAsync('DELETE FROM performance WHERE activityId = ?', [eventId]);
  await db.runAsync('DELETE FROM notifications WHERE relatedEventId = ?', [eventId]);
  await db.runAsync('DELETE FROM events WHERE id = ?', [eventId]);

  return { success: true as const, message: 'Checkout deleted and inventory restored', offline: true };
}

export async function createPerformanceLocal(payload: Row) {
  const db = await getOfflineDb();
  const userId = Number(payload.userId);
  const activityId = Number(payload.activityId);

  const existing = await db.getFirstAsync<Row>(
    'SELECT * FROM performance WHERE userId = ? AND activityId = ? LIMIT 1',
    [userId, activityId]
  );

  if (existing) {
    return { success: true as const, performance: [existing], duplicate: true };
  }

  const row: Row = {
    id: await nextTempId('performance'),
    userId,
    activityId,
    status: payload.status || 'Assigned',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  await insertRow('performance', row);
  return { success: true as const, performance: [row], offline: true };
}

// ------------------------------------------------------------------ staff

export async function createCheckinLocal(payload: Row) {
  const staffId = Number(payload.staffId);
  const tagId = String(payload.tagId ?? '').trim();
  if (!staffId || !tagId) throw new Error('staffId and tagId are required');

  const timestamp = payload.timestamp ? String(payload.timestamp) : nowIso();
  const checkIn: Row = {
    id: await nextTempId('staff_checkins'),
    staffId,
    tagId,
    workstationId: payload.workstationId != null ? Number(payload.workstationId) : null,
    timestamp,
    createdAt: nowIso(),
  };

  await insertRow('staff_checkins', checkIn);
  return {
    success: true as const,
    checkIn,
    offline: true,
    message: 'Check-in saved offline, will sync',
  };
}
