import { db } from '../../../../drizzle/db';
import { staffCheckinsTable, workstationsTable, usersTable } from '../../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

// Record an NFC check-in. If the scanned tag isn't registered as a workstation
// yet, it is created on the fly so stations appear from real scans.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const staffId = Number(body.staffId);
    const tagId = typeof body.tagId === 'string' ? body.tagId.trim() : '';
    const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();

    if (!staffId || !tagId) {
      return NextResponse.json(
        { success: false, message: 'staffId and tagId are required' },
        { status: 400 }
      );
    }

    const user = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, staffId)).limit(1);
    if (user.length === 0) {
      return NextResponse.json({ success: false, message: 'Staff member not found' }, { status: 404 });
    }

    // Resolve workstation by tag; auto-register unknown tags as stations.
    let workstation =
      (await db.select().from(workstationsTable).where(eq(workstationsTable.tagId, tagId)).limit(1))[0] ?? null;
    if (!workstation) {
      const created = await db
        .insert(workstationsTable)
        .values({ name: `Station ${tagId}`, tagId })
        .returning();
      workstation = created[0];
    }

    const inserted = await db
      .insert(staffCheckinsTable)
      .values({
        staffId,
        tagId,
        workstationId: workstation.id,
        timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
      })
      .returning();

    const checkIn = {
      id: inserted[0].id,
      staffId: inserted[0].staffId,
      tagId: inserted[0].tagId,
      workstationId: inserted[0].workstationId ?? undefined,
      timestamp: new Date(inserted[0].timestamp).toISOString(),
    };

    return NextResponse.json({ success: true, checkIn });
  } catch (error) {
    console.error('Error recording check-in:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
