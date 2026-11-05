import { db } from '../../../drizzle/db';
import { usersTable, performanceTable } from '../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';

// Employees are real user accounts. workstationId reflects the branch of the
// user's most recent check-in (performance rows with type='checkin').
export async function GET() {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        role: usersTable.role,
      })
      .from(usersTable)
      .orderBy(usersTable.id);

    const latestCheckIns = await db
      .select({
        staffId: performanceTable.userId,
        workstationId: performanceTable.workstationId,
        timestamp: performanceTable.timestamp,
      })
      .from(performanceTable)
      .where(eq(performanceTable.type, 'checkin'))
      .orderBy(desc(performanceTable.timestamp));

    const latestByStaff = new Map<number, { workstationId: number | null; timestamp: Date }>();
    for (const row of latestCheckIns) {
      if (!latestByStaff.has(row.staffId)) {
        latestByStaff.set(row.staffId, {
          workstationId: row.workstationId,
          timestamp: row.timestamp ?? new Date(0),
        });
      }
    }

    const staff = users.map((u) => {
      const latest = latestByStaff.get(u.id);
      return {
        id: u.id,
        username: u.username,
        fullName: u.username,
        workstationId: latest?.workstationId ?? undefined,
        lastCheckIn: latest ? new Date(latest.timestamp).toISOString() : undefined,
      };
    });

    return NextResponse.json({ success: true, staff });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
