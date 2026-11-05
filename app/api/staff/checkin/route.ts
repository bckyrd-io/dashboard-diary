import { db } from '../../../../drizzle/db';
import { performanceTable, branchesTable, usersTable } from '../../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq, and, sql } from 'drizzle-orm';

// Record an NFC check-in. Check-ins live in the performance table as
// type='checkin' rows (the old staff_checkins table was merged into it).
// The tag must be assigned to a branch (branches.tag_id) — unknown tags are
// rejected with a clear message instead of silently auto-creating stations.
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

    // Resolve the branch that owns this tag.
    const branch = (
      await db.select().from(branchesTable).where(eq(branchesTable.tagId, tagId)).limit(1)
    )[0];
    if (!branch) {
      return NextResponse.json(
        { success: false, message: `NFC tag "${tagId}" is not assigned to a branch` },
        { status: 400 }
      );
    }

    const inserted = await db
      .insert(performanceTable)
      .values({
        userId: staffId,
        type: 'checkin',
        tagId,
        workstationId: branch.id,
        timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
      })
      .returning();

    const checkIn = {
      id: inserted[0].id,
      staffId,
      tagId: inserted[0].tagId,
      workstationId: inserted[0].workstationId ?? undefined,
      timestamp: new Date(inserted[0].timestamp ?? inserted[0].createdAt).toISOString(),
    };

    return NextResponse.json({ success: true, checkIn });
  } catch (error) {
    console.error('Error recording check-in:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
