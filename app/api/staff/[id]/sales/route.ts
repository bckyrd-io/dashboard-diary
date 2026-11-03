import { db } from '../../../../../drizzle/db';
import { eventsTable, performanceTable } from '../../../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { desc, eq, and } from 'drizzle-orm';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await db
      .select({
        eventId: eventsTable.id,
        amount: eventsTable.amount,
        createdAt: eventsTable.createdAt,
      })
      .from(performanceTable)
      .innerJoin(eventsTable, eq(eventsTable.id, performanceTable.activityId))
      .where(and(eq(performanceTable.userId, Number(id)), eq(eventsTable.eventType, 'sale')))
      .orderBy(desc(eventsTable.createdAt));

    const sales = rows.map((r) => ({
      id: r.eventId,
      staffId: Number(id),
      amount: Number(r.amount),
      timestamp: new Date(r.createdAt).toISOString(),
    }));

    return NextResponse.json({ success: true, sales });
  } catch (error) {
    console.error('Error fetching staff sales:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
