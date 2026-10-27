import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
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

// Full JSON backup of the server database. Admin-only: the payload contains
// password hashes so the restore can recreate working logins.
export async function GET(req: Request) {
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

    const [
      branches,
      users,
      categories,
      items,
      events,
      eventItems,
      schedules,
      performance,
      notifications,
    ] = await Promise.all([
      db.select().from(branchesTable),
      db.select().from(usersTable),
      db.select().from(categoriesTable),
      db.select().from(itemsTable),
      db.select().from(eventsTable),
      db.select().from(eventItemsTable),
      db.select().from(schedulesTable),
      db.select().from(performanceTable),
      db.select().from(notificationsTable),
    ]);

    return NextResponse.json({
      success: true,
      version: 1,
      scope: 'server',
      exportedAt: new Date().toISOString(),
      tables: {
        branches,
        users,
        categories,
        items,
        events,
        event_items: eventItems,
        schedules,
        performance,
        notifications,
      },
    });
  } catch (error) {
    console.error('Error exporting backup:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
