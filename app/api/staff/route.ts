import { db } from '../../../drizzle/db';
import { usersTable, staffCheckinsTable } from '../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';

// Employees are real user accounts. workstationId reflects the station of the
// user's most recent check-in (stations are auto-registered from NFC scans).
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
        staffId: staffCheckinsTable.staffId,
        workstationId: staffCheckinsTable.workstationId,
        timestamp: staffCheckinsTable.timestamp,
      })
      .from(staffCheckinsTable)
      .orderBy(desc(staffCheckinsTable.timestamp));

    const latestByStaff = new Map<number, { workstationId: number | null; timestamp: Date }>();
    for (const row of latestCheckIns) {
      if (!latestByStaff.has(row.staffId)) {
        latestByStaff.set(row.staffId, {
          workstationId: row.workstationId,
          timestamp: row.timestamp,
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
