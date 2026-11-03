import { db } from '../../../../../drizzle/db';
import { staffCheckinsTable } from '../../../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await db
      .select()
      .from(staffCheckinsTable)
      .where(eq(staffCheckinsTable.staffId, Number(id)))
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
    console.error('Error fetching staff check-ins:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
