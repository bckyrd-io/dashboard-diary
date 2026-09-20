import { db } from '../../../../drizzle/db';
import { eventsTable, eventItemsTable, itemsTable } from '../../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get event
    const event = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, Number(id)))
      .limit(1);

    if (!event || event.length === 0) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    // Get event items with item details
    const eventItems = await db
      .select({
        id: eventItemsTable.id,
        eventId: eventItemsTable.eventId,
        itemId: eventItemsTable.itemId,
        quantity: eventItemsTable.quantity,
        unitPriceAtSale: eventItemsTable.unitPriceAtSale,
        itemName: itemsTable.name,
        itemBarcode: itemsTable.barcode,
        itemImage: itemsTable.imageUrl,
      })
      .from(eventItemsTable)
      .innerJoin(itemsTable, eq(eventItemsTable.itemId, itemsTable.id))
      .where(eq(eventItemsTable.eventId, Number(id)));

    return NextResponse.json({
      success: true,
      event: { ...event[0], items: eventItems },
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  try {
    const updatedEvent = await db
      .update(eventsTable)
      .set(body)
      .where(eq(eventsTable.id, Number(id)))
      .returning();

    if (!updatedEvent || updatedEvent.length === 0) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, event: updatedEvent[0] });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { items, paymentMethod, description, paymentStatus } = body;

  try {
    const eventId = Number(id);
    const existing = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, eventId))
      .limit(1);

    if (!existing || existing.length === 0) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    const currentEvent = existing[0];

    // Reconcile stock if this was a sale
    if (currentEvent.eventType === 'sale') {
      const oldItems = await db
        .select()
        .from(eventItemsTable)
        .where(eq(eventItemsTable.eventId, eventId));

      // Restore old stock
      for (const old of oldItems) {
        await db
          .update(itemsTable)
          .set({ quantity: sql`quantity + ${Number(old.quantity)}` })
          .where(eq(itemsTable.id, Number(old.itemId)));
      }

      // Deduct new stock if items are provided
      if (items && items.length > 0) {
        for (const item of items) {
          await db
            .update(itemsTable)
            .set({ quantity: sql`quantity - ${Number(item.quantity)}` })
            .where(eq(itemsTable.id, Number(item.itemId)));
        }
      }
    }

    // Calculate total amount if items provided
    let totalAmount = currentEvent.amount;
    if (items && items.length > 0) {
      totalAmount = items.reduce(
        (sum: number, it: { quantity: number; unitPriceAtSale: number }) =>
          sum + Number(it.quantity) * Number(it.unitPriceAtSale),
        0
      );
    }

    // Update event record
    const updated = await db
      .update(eventsTable)
      .set({
        amount: totalAmount,
        paymentMethod: paymentMethod ?? currentEvent.paymentMethod,
        description: description ?? (items ? `Sale - ${items.length} item(s)` : currentEvent.description),
        paymentStatus: paymentStatus ?? currentEvent.paymentStatus,
      })
      .where(eq(eventsTable.id, eventId))
      .returning();

    // Re-insert event items if provided
    if (items && items.length > 0) {
      await db.delete(eventItemsTable).where(eq(eventItemsTable.eventId, eventId));

      const newEventItems = items.map((it: { itemId: number; quantity: number; unitPriceAtSale: number }) => ({
        eventId,
        itemId: Number(it.itemId),
        quantity: Number(it.quantity),
        unitPriceAtSale: Number(it.unitPriceAtSale),
      }));

      await db.insert(eventItemsTable).values(newEventItems);
    }

    return NextResponse.json({
      success: true,
      event: updated[0],
      message: 'Checkout updated successfully',
    });
  } catch (error) {
    console.error('Error updating checkout:', error);
    return NextResponse.json({ success: false, message: 'Failed to update checkout' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const eventId = Number(id);
    const existing = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, eventId))
      .limit(1);

    if (!existing || existing.length === 0) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    const currentEvent = existing[0];
    const items = await db
      .select()
      .from(eventItemsTable)
      .where(eq(eventItemsTable.eventId, eventId));

    // Restore stock if it was a sale
    if (currentEvent.eventType === 'sale') {
      for (const item of items) {
        await db
          .update(itemsTable)
          .set({ quantity: sql`quantity + ${Number(item.quantity)}` })
          .where(eq(itemsTable.id, Number(item.itemId)));
      }
    } else if (currentEvent.eventType === 'receiving') {
      // Revert receiving
      for (const item of items) {
        await db
          .update(itemsTable)
          .set({ quantity: sql`quantity - ${Number(item.quantity)}` })
          .where(eq(itemsTable.id, Number(item.itemId)));
      }
    } else if (currentEvent.eventType === 'transfer' && currentEvent.branchId && currentEvent.toBranchId) {
      // Revert transfer: add back to source branch, deduct from dest branch
      for (const item of items) {
        await db
          .update(itemsTable)
          .set({ quantity: sql`quantity + ${Number(item.quantity)}` })
          .where(eq(itemsTable.id, Number(item.itemId)));
      }
    }

    // Delete event items and event
    await db.delete(eventItemsTable).where(eq(eventItemsTable.eventId, eventId));
    await db.delete(eventsTable).where(eq(eventsTable.id, eventId));

    return NextResponse.json({
      success: true,
      message: 'Checkout deleted and inventory restored successfully',
    });
  } catch (error) {
    console.error('Error deleting checkout event:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete checkout' }, { status: 500 });
  }
}
