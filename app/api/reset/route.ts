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
//
// The wipe uses a single TRUNCATE ... RESTART IDENTITY CASCADE over every
// table in the public schema instead of ordered DELETEs: TRUNCATE ignores
// foreign-key ordering entirely (an earlier DELETE-based version failed on
// payments.event_id when production still ran older code), restarts every
// identity sequence so the new admin lands on id 1, and CASCADE also clears
// legacy tables (workstations, staff_checkins) that reference these tables.

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
      // Discover every public table at runtime so the wipe works on both the
      // local DB and production even if one of them still has legacy tables.
      const tableRows = await tx.execute<{ tablename: string }>(
        sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
      );
      const tables = (tableRows.rows ?? []).map((r) => r.tablename);
      if (tables.length === 0) {
        throw new Error('No tables found in the public schema');
      }

      const truncateSql = sql.join(
        tables.map((t) => sql.identifier(t)),
        sql`, `
      );
      await tx.execute(sql`TRUNCATE ${truncateSql} RESTART IDENTITY CASCADE`);

      // Count what is left (everything should be 0) for the response body.
      for (const table of tables) {
        const res = await tx.execute(sql`SELECT count(*)::int AS n FROM ${sql.identifier(table)}`);
        counts[table] = Number((res.rows?.[0] as { n?: number } | undefined)?.n ?? 0);
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
