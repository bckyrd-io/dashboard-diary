import { db } from '../../../../../drizzle/db';
import { performanceTable } from '../../../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await db
      .select()
      .from(performanceTable)
      .where(and(eq(performanceTable.type, 'checkin'), eq(performanceTable.userId, Number(id))))
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
