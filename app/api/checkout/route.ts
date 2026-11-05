import { db } from '../../../drizzle/db';
import { eventsTable, eventItemsTable, itemsTable, notificationsTable, performanceTable, usersTable } from '../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { assertStockAvailable, deductStock, StockError } from '../../../lib/stock';

export async function POST(req: Request) {
  const body = await req.json();
  const { items, paymentMethod, description, paymentReference, userId, clientOpId } = body;

  try {
    // Offline replay idempotency: a crash after the sale was written but before
    // the device removed it from its outbox must not deduct stock twice.
    if (clientOpId) {
      const existingEvent = await db
        .select()
        .from(eventsTable)
        .where(eq(eventsTable.clientOpId, String(clientOpId)))
        .limit(1);

      if (existingEvent.length > 0) {
        return NextResponse.json({
          success: true,
          event: existingEvent[0],
          duplicate: true,
          message: 'Checkout already processed',
        });
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += Number(item.quantity) * Number(item.unitPriceAtSale);
    }

    const newEvent = await db.transaction(async (tx) => {
      // Reject the whole sale before writing anything if stock can't cover it.
      await assertStockAvailable(items, {}, tx);

      // Create the sale event
      const inserted = await tx
        .insert(eventsTable)
        .values({
          eventType: 'sale',
          financialType: 'Revenue',
          description: description || `Sale - ${items.length} item(s)`,
          amount: totalAmount,
          date: new Date().toISOString().split('T')[0],
          paymentMethod,
          paymentReference: paymentReference || null,
          paymentStatus: 'success',
          clientOpId: clientOpId ? String(clientOpId) : undefined,
        })
        .returning();

      // Attribute the sale to the logged-in user so it shows up in their
      // scoped dashboard ("data generated about them" for staff users).
      if (userId) {
        const sellingUser = await tx
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.id, Number(userId)))
          .limit(1);

        if (sellingUser.length > 0) {
          await tx.insert(performanceTable).values({
            userId: sellingUser[0].id,
            activityId: inserted[0].id,
            status: 'Completed',
          });
        }
      }

      // Create event items and deduct stock (guarded: never goes negative)
      for (const item of items) {
        await tx.insert(eventItemsTable).values({
          eventId: inserted[0].id,
          itemId: Number(item.itemId),
          quantity: Number(item.quantity),
          unitPriceAtSale: Number(item.unitPriceAtSale),
        });

        await deductStock(tx, Number(item.itemId), Number(item.quantity));
      }

      // Check for low stock and create notifications
      for (const item of items) {
        const itemData = await tx
          .select()
          .from(itemsTable)
          .where(eq(itemsTable.id, Number(item.itemId)))
          .limit(1);

        if (itemData[0] && itemData[0].reorderThreshold && itemData[0].quantity <= itemData[0].reorderThreshold) {
          // Get admin users to notify
          const admins = await tx
            .select()
            .from(usersTable)
            .where(eq(usersTable.role, 'admin'));

          for (const admin of admins) {
            await tx.insert(notificationsTable).values({
              userId: admin.id,
              type: 'low_stock',
              title: 'Low Stock Alert',
              body: `${itemData[0].name} is running low (${itemData[0].quantity} remaining)`,
              relatedItemId: Number(item.itemId),
            });
          }
        }
      }

      return inserted[0];
    });

    return NextResponse.json({
      success: true,
      event: newEvent,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    if (error instanceof StockError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process checkout' },
      { status: 500 }
    );
  }
}
