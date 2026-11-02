import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../../../drizzle/db';
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
} from '../../../drizzle/db/schema';

// Destructive test-reset endpoint: wipes ALL rows from every table, then
// recreates a default branch + admin account so the app stays usable.
// Admin-only (same guard as backup export/import) and requires an explicit
// confirmation flag so a stray GET/cron call can never wipe the database.
//
//   POST /api/reset?userId=<adminId>
//   Body: { "confirm": true }
//
// Optional body fields: { "branchName": "...", "username": "...", "password": "..." }
const ALL_TABLES = [
  'event_items',
  'schedules',
  'performance',
  'notifications',
  'events',
  'items',
  'categories',
  'users',
  'branches',
] as const;

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

    const body = await req.json().catch(() => null);
    if (!body || body.confirm !== true) {
      return NextResponse.json(
        { success: false, message: 'Send { "confirm": true } — this deletes every row' },
        { status: 400 }
      );
    }

    const branchName = typeof body.branchName === 'string' && body.branchName.trim()
      ? body.branchName.trim()
      : 'Test Branch';
    const username = typeof body.username === 'string' && body.username.trim()
      ? body.username.trim()
      : 'admin';
    const password = typeof body.password === 'string' && body.password
      ? body.password
      : 'admin123';

    const counts: Record<string, number> = {};

    await db.transaction(async (tx) => {
      for (const table of ALL_TABLES) {
        const res = await tx.execute(sql`DELETE FROM ${sql.identifier(table)}`);
        counts[table] = Number((res as { rowCount?: number }).rowCount ?? 0);
      }

      // Reset identity sequences BEFORE reseeding so the default branch and admin
      // land on id 1 (and `?userId=1` stays valid on every future reset).
      // NOTE: pg_get_serial_sequence's first argument must be a *string literal*
      // ('event_items'), not an identifier — passing sql.identifier() there makes
      // Postgres read the table name as a column reference and the tx aborts.
      for (const table of ALL_TABLES) {
        await tx.execute(
          sql`SELECT setval(pg_get_serial_sequence(${sql.raw(`'${table}'`)}, 'id'), COALESCE((SELECT MAX(id) FROM ${sql.identifier(table)}), 0) + 1, false)`
        );
      }

      // Reinsert a default branch first — users.branch_id references it.
      const [branch] = await tx
        .insert(branchesTable)
        .values({ name: branchName, location: 'Head Office' })
        .returning();

      const passwordHash = await bcrypt.hash(password, 10);

      const [admin] = await tx
        .insert(usersTable)
        .values({
          username,
          passwordHash,
          email: `${username}@example.com`,
          branchId: branch.id,
          role: 'admin',
        })
        .returning();

      return { branch, admin };
    });

    const [branch] = await db.select().from(branchesTable).limit(1);
    const [admin] = await db.select().from(usersTable).limit(1);

    return NextResponse.json({
      success: true,
      message: 'Database reset. All rows deleted.',
      deleted: counts,
      login: {
        username: admin?.username ?? username,
        password,
        role: 'admin',
        userId: admin?.id ?? null,
        branch: branch?.name ?? branchName,
      },
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
