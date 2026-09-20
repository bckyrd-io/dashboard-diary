import { db } from '../../../drizzle/db';
import { itemsTable, eventItemsTable } from '../../../drizzle/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// Create a new item (resource)
export async function POST(req: Request) {
    const { name, quantity, unit, activityId, allocatedQuantity } = await req.json();

    if (!name) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    try {
        const newItem = await db.insert(itemsTable).values({
            name,
            quantity: quantity ? Number(quantity) : 0,
            unit: unit || null,
        }).returning();

        if (activityId) {
            await db.insert(eventItemsTable).values({
                eventId: Number(activityId),
                itemId: newItem[0].id,
                quantity: allocatedQuantity ? Number(allocatedQuantity) : 0,
                unitPriceAtSale: 0,
            }).returning();
        }

        return NextResponse.json({ success: true, resource: newItem });
    } catch (error) {
        console.error('Error creating resource:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

// Get all items (resources)
export async function GET() {
    try {
        const resources = await db.select().from(itemsTable);
        return NextResponse.json({ success: true, resources });
    } catch (error) {
        console.error('Error fetching resources:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

// Update an item (resource)
export async function PUT(req: Request) {
    const { id, name, quantity, unit, activityId, allocatedQuantity } = await req.json();

    if (!id || !name) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    try {
        const updatedResource = await db
            .update(itemsTable)
            .set({
                name,
                quantity: quantity !== undefined ? Number(quantity) : 0,
                unit: unit || null,
            })
            .where(eq(itemsTable.id, Number(id)))
            .returning();

        if (activityId) {
            await db
                .update(eventItemsTable)
                .set({ quantity: allocatedQuantity !== undefined ? Number(allocatedQuantity) : 0 })
                .where(eq(eventItemsTable.itemId, Number(id)))
                .returning();
        }

        return NextResponse.json({ success: true, resource: updatedResource });
    } catch (error) {
        console.error('Error updating resource:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

// Delete an item (resource)
export async function DELETE(req: Request) {
    const { id } = await req.json();

    if (!id) {
        return NextResponse.json({ success: false, message: 'Missing resource ID' }, { status: 400 });
    }

    try {
        await db.delete(eventItemsTable).where(eq(eventItemsTable.itemId, Number(id)));
        const deletedCount = await db.delete(itemsTable).where(eq(itemsTable.id, Number(id))).returning();

        if (!deletedCount || deletedCount.length === 0) {
            return NextResponse.json({ success: false, message: 'Resource not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Resource deleted' });
    } catch (error) {
        console.error('Error deleting resource:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
