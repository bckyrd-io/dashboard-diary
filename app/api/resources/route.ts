import { db } from '../../../drizzle/db';
import { resourcesTable, activityResourcesTable } from '../../../drizzle/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// Create a new resource
export async function POST(req: Request) {
    const { name, quantity, unit, activityId, allocatedQuantity } = await req.json();

    if (!name) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    try {
        const newResource = await db.insert(resourcesTable).values({
            name,
<<<<<<< Updated upstream
            quantity: quantity || 0,
            unit: unit,
=======
            quantity: quantity ? Number(quantity) : 0,
            unit: unit || null,
>>>>>>> Stashed changes
        }).returning();

        if (activityId) {
            await db.insert(activityResourcesTable).values({
                activityId: Number(activityId),
                resourceId: newResource[0].id,
                allocatedQuantity: allocatedQuantity ? Number(allocatedQuantity) : 0,
            }).returning();
        }

        return NextResponse.json({ success: true, resource: newResource });
    } catch (error) {
        console.error('Error creating resource:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

// Get all resources
export async function GET() {
    try {
        const resources = await db.select().from(resourcesTable);
        return NextResponse.json({ success: true, resources });
    } catch (error) {
        console.error('Error fetching resources:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

// Update a resource
export async function PUT(req: Request) {
    const { id, name, quantity, unit, activityId, allocatedQuantity } = await req.json();

    if (!id || !name) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    try {
        const updatedResource = await db
            .update(resourcesTable)
            .set({
                name,
                quantity: quantity !== undefined ? Number(quantity) : 0,
                unit: unit || null,
            })
            .where(eq(resourcesTable.id, Number(id)))
            .returning();

        if (activityId) {
            await db
                .update(activityResourcesTable)
                .set({ allocatedQuantity: allocatedQuantity !== undefined ? Number(allocatedQuantity) : 0 })
                .where(eq(activityResourcesTable.resourceId, Number(id)))
                .returning();
        }

        return NextResponse.json({ success: true, resource: updatedResource });
    } catch (error) {
        console.error('Error updating resource:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

// Delete a resource
export async function DELETE(req: Request) {
    const { id } = await req.json();

    if (!id) {
        return NextResponse.json({ success: false, message: 'Missing resource ID' }, { status: 400 });
    }

    try {
        await db.delete(activityResourcesTable).where(eq(activityResourcesTable.resourceId, Number(id)));
        const deletedCount = await db.delete(resourcesTable).where(eq(resourcesTable.id, Number(id))).returning();

        if (!deletedCount || deletedCount.length === 0) {
            return NextResponse.json({ success: false, message: 'Resource not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Resource deleted' });
    } catch (error) {
        console.error('Error deleting resource:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
