import { db } from '../../../../drizzle/db';
import {
  eventsTable,
  eventItemsTable,
  itemsTable,
  schedulesTable,
  performanceTable,
  notificationsTable,
  paymentsTable,
} from '../../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq, and, sql } from 'drizzle-orm';
import { assertStockAvailable, deductStock, addStock, StockError } from '../../../../lib/stock';

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

    const updated = await db.transaction(async (tx) => {
      // Reconcile stock if this was a sale
      if (currentEvent.eventType === 'sale') {
        const oldItems = await tx
          .select()
          .from(eventItemsTable)
          .where(eq(eventItemsTable.eventId, eventId));

        // Restore old stock
        for (const old of oldItems) {
          await addStock(tx, Number(old.itemId), Number(old.quantity));
        }

        // Deduct new stock if items are provided (validated + guarded, so an
        // edit that oversells rolls the whole change back with a 409)
        if (items && items.length > 0) {
          await assertStockAvailable(items, {}, tx);
          for (const item of items) {
            await deductStock(tx, Number(item.itemId), Number(item.quantity));
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
      const eventRows = await tx
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
        await tx.delete(eventItemsTable).where(eq(eventItemsTable.eventId, eventId));

        const newEventItems = items.map((it: { itemId: number; quantity: number; unitPriceAtSale: number }) => ({
          eventId,
          itemId: Number(it.itemId),
          quantity: Number(it.quantity),
          unitPriceAtSale: Number(it.unitPriceAtSale),
        }));

        await tx.insert(eventItemsTable).values(newEventItems);
      }

      return eventRows[0];
    });

    return NextResponse.json({
      success: true,
      event: updated,
      message: 'Checkout updated successfully',
    });
  } catch (error) {
    if (error instanceof StockError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
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

    await db.transaction(async (tx) => {
      const items = await tx
        .select()
        .from(eventItemsTable)
        .where(eq(eventItemsTable.eventId, eventId));

      // Restore stock if it was a sale
      if (currentEvent.eventType === 'sale') {
        for (const item of items) {
          await addStock(tx, Number(item.itemId), Number(item.quantity));
        }
      } else if (currentEvent.eventType === 'receiving') {
        // Revert receiving (guarded: fails with 409 if the stock was already
        // sold off — we never drive the balance negative)
        for (const item of items) {
          await deductStock(tx, Number(item.itemId), Number(item.quantity));
        }
      } else if (currentEvent.eventType === 'transfer' && currentEvent.branchId && currentEvent.toBranchId) {
        // Revert transfer: credit the source row AND debit the destination
        // row. The event's line items point at the SOURCE row, so adding to
        // it restores the source; the destination clone must give the stock
        // back or it stays double-counted.
        for (const item of items) {
          const srcRow = await tx
            .select()
            .from(itemsTable)
            .where(eq(itemsTable.id, Number(item.itemId)))
            .limit(1);

          if (srcRow.length > 0) {
            await addStock(tx, srcRow[0].id, Number(item.quantity));

            const destRows = await tx
              .select()
              .from(itemsTable)
              .where(
                and(
                  eq(itemsTable.branchId, Number(currentEvent.toBranchId)),
                  sql`lower(btrim(${itemsTable.name})) = lower(btrim(${srcRow[0].name}))`
                )
              )
              .limit(1);

            if (destRows.length > 0) {
              await deductStock(tx, destRows[0].id, Number(item.quantity));

              // If this revert emptied the destination row, it is most likely
              // the clone the transfer created — remove it so the product
              // doesn't linger as a phantom "0 stock at branch X" row.
              // Rows with sales history are kept (event_items would cascade).
              await tx.execute(sql`
                DELETE FROM items
                WHERE id = ${destRows[0].id}
                  AND coalesce(quantity, 0) = 0
                  AND NOT EXISTS (
                    SELECT 1 FROM event_items ei WHERE ei.item_id = ${destRows[0].id}
                  )`);
            }
          }
        }
      }

      // Detach payment intents first — payments.event_id would otherwise block
      // the delete (FK with no cascade). The payment record itself is kept as
      // gateway history, just no longer linked to a (now deleted) sale.
      await tx
        .update(paymentsTable)
        .set({ eventId: null, updatedAt: new Date() })
        .where(eq(paymentsTable.eventId, eventId));

      // Delete event items, event, and everything that references it so the
      // calendar (schedules), staff attribution (performance), and notification
      // feeds don't keep ghosts of a deleted event.
      await tx.delete(eventItemsTable).where(eq(eventItemsTable.eventId, eventId));
      await tx.delete(schedulesTable).where(eq(schedulesTable.activityId, eventId));
      await tx.delete(performanceTable).where(eq(performanceTable.activityId, eventId));
      await tx.delete(notificationsTable).where(eq(notificationsTable.relatedEventId, eventId));
      await tx.delete(eventsTable).where(eq(eventsTable.id, eventId));
    });

    return NextResponse.json({
      success: true,
      message: 'Checkout deleted and inventory restored successfully',
    });
  } catch (error) {
    if (error instanceof StockError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error('Error deleting checkout event:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete checkout' }, { status: 500 });
  }
}
