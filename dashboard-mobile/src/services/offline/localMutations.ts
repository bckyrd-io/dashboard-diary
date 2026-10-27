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

async function adjustStock(itemId: number, delta: number) {
  const db = await getOfflineDb();
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
      if (source?.name && toBranchId != null) {
        const db = await getOfflineDb();
        const destination = await db.getFirstAsync<Row>(
          'SELECT * FROM items WHERE branchId = ? AND name = ? LIMIT 1',
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
    for (const item of oldItems) {
      await adjustStock(Number(item.itemId), Number(item.quantity));
    }
  }

  const items: Row[] = Array.isArray(payload.items) ? payload.items : [];
  if (existing.eventType === 'sale') {
    for (const item of items) {
      await adjustStock(Number(item.itemId), -Number(item.quantity));
    }
  }

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

  if (existing.eventType === 'sale' || existing.eventType === 'transfer') {
    for (const item of items) {
      await adjustStock(Number(item.itemId), Number(item.quantity));
    }
  } else if (existing.eventType === 'receiving') {
    for (const item of items) {
      await adjustStock(Number(item.itemId), -Number(item.quantity));
    }
  }

  await db.runAsync('DELETE FROM event_items WHERE eventId = ?', [eventId]);
  await db.runAsync('DELETE FROM schedules WHERE activityId = ?', [eventId]);
  await db.runAsync('DELETE FROM performance WHERE activityId = ?', [eventId]);
  await db.runAsync('DELETE FROM notifications WHERE relatedEventId = ?', [eventId]);
  await db.runAsync('DELETE FROM events WHERE id = ?', [eventId]);

  return { success: true as const, message: 'Checkout deleted and inventory restored', offline: true };
}

export async function createActivityLocal(payload: Row, clientOpId: string) {
  const eventId = await nextTempId('events');
  const activityDate = payload.activityDate || today();

  const event: Row = {
    id: eventId,
    eventType: 'adjustment',
    financialType: payload.activityType || 'Neutral',
    description: payload.description,
    amount: Number(payload.amount) || 0,
    date: activityDate,
    branchId: null,
    toBranchId: null,
    paymentMethod: null,
    paymentReference: null,
    paymentStatus: null,
    isRecurring: 0,
    recurrenceRule: null,
    clientOpId,
    createdAt: nowIso(),
  };

  await insertRow('events', event);

  if (new Date(activityDate) > new Date()) {
    await insertRow('schedules', {
      id: await nextTempId('schedules'),
      activityId: eventId,
      scheduledDate: activityDate,
      notificationMessage: `Upcoming activity: ${payload.description} on ${activityDate}`,
      createdAt: nowIso(),
    });
  }

  return { success: true as const, activity: [event], offline: true };
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
