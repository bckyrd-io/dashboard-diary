import { db } from '../../../../drizzle/db';
import { performanceTable } from '../../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';

// Check-ins are performance rows with type='checkin'; the response shape
// matches the old staff_checkins table so mobile needs no changes.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');

    const conditions = [eq(performanceTable.type, 'checkin')];
    if (staffId) {
      conditions.push(eq(performanceTable.userId, Number(staffId)));
    }

    const rows = await db
      .select()
      .from(performanceTable)
      .where(and(...conditions))
      .orderBy(desc(performanceTable.timestamp));

    const checkIns = rows.map((r) => ({
      id: r.id,
      staffId: r.userId,
      tagId: r.tagId,
      workstationId: r.workstationId ?? undefined,
      timestamp: new Date(r.timestamp ?? r.createdAt).toISOString(),
    }));

    return NextResponse.json({ success: true, checkIns });
  } catch (error) {
    console.error('Error fetching staff check-ins:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
