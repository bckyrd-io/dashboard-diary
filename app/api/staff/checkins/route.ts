import { db } from '../../../../drizzle/db';
import { staffCheckinsTable } from '../../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');

    const rows = staffId
      ? await db
          .select()
          .from(staffCheckinsTable)
          .where(eq(staffCheckinsTable.staffId, Number(staffId)))
          .orderBy(desc(staffCheckinsTable.timestamp))
      : await db
          .select()
          .from(staffCheckinsTable)
          .orderBy(desc(staffCheckinsTable.timestamp));

    const checkIns = rows.map((r) => ({
      id: r.id,
      staffId: r.staffId,
      tagId: r.tagId,
      workstationId: r.workstationId ?? undefined,
      timestamp: new Date(r.timestamp).toISOString(),
    }));

    return NextResponse.json({ success: true, checkIns });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
