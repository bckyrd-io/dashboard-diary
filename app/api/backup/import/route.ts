import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../../../drizzle/db';
import {
  branchesTable,
  categoriesTable,
  eventItemsTable,
  eventsTable,
  itemsTable,
  notificationsTable,
  performanceTable,
  schedulesTable,
  usersTable,
} from '../../../../drizzle/db/schema';

const REQUIRED_TABLES = [
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

// Postgres timestamp columns are read as ISO strings from JSON; Drizzle expects
// Date objects for `timestamp()` columns.
function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

function num(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function text(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
}

// Replaces ALL server data with the supplied backup in a single transaction.
// Admin-only: backups contain password hashes.
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }

    const requester = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, Number(userId)))
      .limit(1);

    const isAdmin =
      requester.length > 0 && requester[0].role.trim().toLowerCase() === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
    }

    const payload = await req.json().catch(() => null);

    if (!payload || payload.version !== 1 || !payload.tables || typeof payload.tables !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid backup file: expected version 1 with a tables object' },
        { status: 400 }
      );
    }

    if (payload.scope && payload.scope !== 'server') {
      return NextResponse.json(
        { success: false, message: 'This is a local device snapshot and cannot be restored to the server' },
        { status: 400 }
      );
    }

    const missing = REQUIRED_TABLES.filter((table) => !Array.isArray(payload.tables[table]));
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Invalid backup file: missing tables ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const t = payload.tables;

    const branches = (t.branches as any[]).map((row) => ({
      id: num(row.id) ?? undefined,
      name: String(row.name),
      location: String(row.location),
      createdAt: toDate(row.createdAt) ?? undefined,
      updatedAt: toDate(row.updatedAt) ?? undefined,
    }));

    const users = (t.users as any[]).map((row) => ({
      id: num(row.id) ?? undefined,
      username: String(row.username),
      passwordHash: String(row.passwordHash),
      email: String(row.email),
      branchId: num(row.branchId) ?? undefined,
      role: row.role ? String(row.role) : 'Staff',
      image: text(row.image),
      pushToken: text(row.pushToken),
      createdAt: toDate(row.createdAt) ?? undefined,
      updatedAt: toDate(row.updatedAt) ?? undefined,
    }));

    const categories = (t.categories as any[]).map((row) => ({
      id: num(row.id) ?? undefined,
      name: String(row.name),
      createdAt: toDate(row.createdAt) ?? undefined,
    }));

    const items = (t.items as any[]).map((row) => ({
      id: num(row.id) ?? undefined,
      name: String(row.name),
      category: row.category ? String(row.category) : 'physical-product',
      subCategory: text(row.subCategory),
      barcode: text(row.barcode),
      sku: text(row.sku),
      price: num(row.price) ?? 0,
      costPrice: num(row.costPrice),
      quantity: num(row.quantity) ?? 0,
      unit: text(row.unit),
      reorderThreshold: num(row.reorderThreshold),
      imageUrl: text(row.imageUrl),
      branchId: num(row.branchId),
      clientOpId: text(row.clientOpId),
      createdAt: toDate(row.createdAt) ?? undefined,
      updatedAt: toDate(row.updatedAt) ?? undefined,
    }));

    const events = (t.events as any[]).map((row) => ({
      id: num(row.id) ?? undefined,
      eventType: String(row.eventType),
      financialType: row.financialType ? String(row.financialType) : 'Neutral',
      description: String(row.description),
      amount: num(row.amount) ?? 0,
      date: String(row.date),
      branchId: num(row.branchId),
      toBranchId: num(row.toBranchId),
      paymentMethod: text(row.paymentMethod),
      paymentReference: text(row.paymentReference),
      paymentStatus: text(row.paymentStatus),
      isRecurring: row.isRecurring === true,
      recurrenceRule: text(row.recurrenceRule),
      clientOpId: text(row.clientOpId),
      createdAt: toDate(row.createdAt) ?? undefined,
    }));

    const eventItems = (t.event_items as any[]).map((row) => ({
      id: num(row.id) ?? undefined,
      eventId: num(row.eventId) ?? undefined,
      itemId: num(row.itemId) ?? undefined,
      quantity: num(row.quantity) ?? 1,
      unitPriceAtSale: num(row.unitPriceAtSale) ?? 0,
      createdAt: toDate(row.createdAt) ?? undefined,
    }));

    const schedules = (t.schedules as any[]).map((row) => ({
      id: num(row.id) ?? undefined,
      activityId: num(row.activityId) ?? undefined,
      scheduledDate: String(row.scheduledDate),
      notificationMessage: text(row.notificationMessage),
      createdAt: toDate(row.createdAt) ?? undefined,
    }));

    const performance = (t.performance as any[]).map((row) => ({
      id: num(row.id) ?? undefined,
      userId: num(row.userId) ?? undefined,
      activityId: num(row.activityId) ?? undefined,
      status: row.status ? String(row.status) : 'Assigned',
      createdAt: toDate(row.createdAt) ?? undefined,
      updatedAt: toDate(row.updatedAt) ?? undefined,
    }));

    const notifications = (t.notifications as any[]).map((row) => ({
      id: num(row.id) ?? undefined,
      userId: num(row.userId) ?? undefined,
      type: String(row.type),
      title: String(row.title),
      body: String(row.body),
      isRead: row.isRead === true,
      relatedEventId: num(row.relatedEventId),
      relatedItemId: num(row.relatedItemId),
      createdAt: toDate(row.createdAt) ?? undefined,
    }));

    const tables = [
      ['branches', branchesTable, branches],
      ['users', usersTable, users],
      ['categories', categoriesTable, categories],
      ['items', itemsTable, items],
      ['events', eventsTable, events],
      ['event_items', eventItemsTable, eventItems],
      ['schedules', schedulesTable, schedules],
      ['performance', performanceTable, performance],
      ['notifications', notificationsTable, notifications],
    ] as const;

    const counts: Record<string, number> = {};

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`TRUNCATE TABLE "event_items", "schedules", "performance", "notifications", "events", "items", "categories", "users", "branches" RESTART IDENTITY CASCADE`
      );

      for (const [name, table, rows] of tables) {
        if (rows.length > 0) {
          await tx.insert(table as any).values(rows as any);
        }
        counts[name] = rows.length;
      }

      // Explicit IDs do not advance serial sequences; realign them so future
      // inserts do not collide with restored rows.
      for (const [name] of tables) {
        await tx.execute(
          sql`SELECT setval(pg_get_serial_sequence(${name}, 'id'), COALESCE((SELECT MAX(id) FROM ${sql.identifier(name)}), 0) + 1, false)`
        );
      }
    });

    return NextResponse.json({ success: true, message: 'Backup restored', counts });
  } catch (error) {
    console.error('Error importing backup:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
