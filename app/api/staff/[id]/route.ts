import { db } from '../../../../drizzle/db';
import { usersTable, staffCheckinsTable } from '../../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, Number(id))).limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 });
    }

    const latest = await db
      .select({ workstationId: staffCheckinsTable.workstationId })
      .from(staffCheckinsTable)
      .where(eq(staffCheckinsTable.staffId, Number(id)))
      .orderBy(desc(staffCheckinsTable.timestamp))
      .limit(1);

    const u = rows[0];
    return NextResponse.json({
      success: true,
      staff: {
        id: u.id,
        username: u.username,
        fullName: u.username,
        workstationId: latest[0]?.workstationId ?? undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching staff member:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
