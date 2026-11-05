import { db } from '../../../../drizzle/db';
import { branchesTable } from '../../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

// Tag lookup against branches (workstations were folded into branches).
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get('tag');

    if (!tag) {
      return NextResponse.json({ success: false, message: 'tag query parameter is required' }, { status: 400 });
    }

    const rows = await db
      .select({
        id: branchesTable.id,
        name: branchesTable.name,
        tagId: branchesTable.tagId,
        createdAt: branchesTable.createdAt,
        updatedAt: branchesTable.updatedAt,
      })
      .from(branchesTable)
      .where(eq(branchesTable.tagId, tag))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ success: false, workstation: null });
    }

    return NextResponse.json({ success: true, workstation: rows[0] });
  } catch (error) {
    console.error('Error finding workstation by tag:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
