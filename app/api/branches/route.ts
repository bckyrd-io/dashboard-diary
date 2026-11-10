import { db } from '../../../drizzle/db';
import { branchesTable, itemsTable } from '../../../drizzle/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// Create Branch
// `tagId` is optional: the NFC tag ID of the workstation tag at this branch
// (e.g. "STATION-001"), used by /api/workstations/by-tag for staff check-ins.
export async function POST(req: Request) {
    const { name, location, tagId } = await req.json();

    if (!name || !location) {
        return NextResponse.json({ success: false, message: 'Name and location are required' }, { status: 400 });
    }

    // Empty/whitespace-only -> null (a branch may exist without a tag).
    const cleanTagId = typeof tagId === 'string' && tagId.trim() ? tagId.trim() : null;

    try {
        const [newBranch] = await db.insert(branchesTable).values({
            name,
            location,
            tagId: cleanTagId,
        }).returning();

        return NextResponse.json({ success: true, message: 'Branch created successfully', branch: newBranch });
    } catch (error: unknown) {
        if (error instanceof Error && (error.message.includes('unique') || error.message.includes('duplicate'))) {
            const message = error.message.includes('tag_id')
                ? 'NFC tag ID is already assigned to another branch'
                : 'Branch name already exists';
            return NextResponse.json({ success: false, message }, { status: 409 });
        }
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

// Get All Branches with Additional Metrics (inventory count per branch)
export async function GET() {
    try {
        const branchesWithItemCount = await db
            .select({
                id: branchesTable.id,
                name: branchesTable.name,
                location: branchesTable.location,
                tagId: branchesTable.tagId,
                // Distinct PRODUCTS per branch — a transfer clones the row, so a
                // plain count would inflate this number.
                itemCount: sql<number>`count(DISTINCT lower(btrim(${itemsTable.name})) || '|' || coalesce(${itemsTable.category}::text, '') || '|' || coalesce(${itemsTable.subCategory}::text, ''))::int`.as('itemCount')
            })
            .from(branchesTable)
            .leftJoin(itemsTable, eq(itemsTable.branchId, branchesTable.id))
            .groupBy(branchesTable.id, branchesTable.name, branchesTable.location);

        return NextResponse.json({ success: true, branches: branchesWithItemCount });
    } catch (error: unknown) {
        console.error('Error fetching branches:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

// Update Branch
// `tagId` is settable/clearable: send a non-empty string to assign it, an
// empty string (or null) to remove it. Omit the key to leave it unchanged.
export async function PATCH(req: Request) {
    const body = await req.json();
    const { id, name, location } = body;
    const hasTagId = 'tagId' in body;

    try {
        const values: { name?: string; location?: string; tagId?: string | null; updatedAt: Date } = {
            updatedAt: new Date(),
        };
        if (typeof name === 'string') values.name = name;
        if (typeof location === 'string') values.location = location;
        if (hasTagId) {
            values.tagId = typeof body.tagId === 'string' && body.tagId.trim() ? body.tagId.trim() : null;
        }

        const updatedBranch = await db.update(branchesTable)
            .set(values)
            .where(eq(branchesTable.id, Number(id)))
            .returning();

        if (!updatedBranch || updatedBranch.length === 0) {
            return NextResponse.json({ success: false, message: 'Branch not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Branch updated successfully', branch: updatedBranch[0] });
    } catch (error: unknown) {
        if (error instanceof Error && (error.message.includes('unique') || error.message.includes('duplicate'))) {
            const message = error.message.includes('tag_id')
                ? 'NFC tag ID is already assigned to another branch'
                : 'Branch name already exists';
            return NextResponse.json({ success: false, message }, { status: 409 });
        }
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

// Delete Branch
export async function DELETE(req: Request) {
    const { id } = await req.json();

    try {
        const deletedBranch = await db.delete(branchesTable)
            .where(eq(branchesTable.id, Number(id)))
            .returning();

        if (!deletedBranch || deletedBranch.length === 0) {
            return NextResponse.json({ success: false, message: 'Branch not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Branch deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting branch:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
