import { db } from '../../../../drizzle/db';
import { eventsTable, performanceTable } from '../../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';

// Staff sales = real sale events attributed to users through the performance
// table (checkout writes that attribution when userId is passed).
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');

    const rows = await db
      .select({
        eventId: eventsTable.id,
        amount: eventsTable.amount,
        createdAt: eventsTable.createdAt,
        staffId: performanceTable.userId,
      })
      .from(performanceTable)
      .innerJoin(eventsTable, eq(eventsTable.id, performanceTable.activityId))
      .where(eq(eventsTable.eventType, 'sale'))
      .orderBy(desc(eventsTable.createdAt));

    const sales = rows
      .filter((r) => r.staffId !== null && (!staffId || r.staffId === Number(staffId)))
      .map((r) => ({
        id: r.eventId,
        staffId: r.staffId,
        amount: Number(r.amount),
        timestamp: new Date(r.createdAt).toISOString(),
      }));

    return NextResponse.json({ success: true, sales });
  } catch (error) {
    console.error('Error fetching staff sales:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
