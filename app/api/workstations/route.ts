import { db } from '../../../drizzle/db';
import { branchesTable } from '../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { asc, isNotNull } from 'drizzle-orm';

// Workstations were folded into branches: a "station" is simply a branch with
// an NFC tag assigned (branches.tag_id). Response shape kept identical to the
// old /api/workstations table read.
export async function GET() {
  try {
    const rows = await db
      .select({
        id: branchesTable.id,
        name: branchesTable.name,
        tagId: branchesTable.tagId,
        createdAt: branchesTable.createdAt,
        updatedAt: branchesTable.updatedAt,
      })
      .from(branchesTable)
      .where(isNotNull(branchesTable.tagId))
      .orderBy(asc(branchesTable.id));

    return NextResponse.json({ success: true, workstations: rows });
  } catch (error) {
    console.error('Error fetching workstations:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
