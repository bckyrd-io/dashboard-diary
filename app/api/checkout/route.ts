import { db } from '../../../drizzle/db';
import { eventsTable, eventItemsTable, itemsTable, notificationsTable, usersTable } from '../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';

export async function POST(req: Request) {
  const body = await req.json();
  const { items, paymentMethod, description, paymentReference } = body;

  try {
    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += Number(item.quantity) * Number(item.unitPriceAtSale);
    }

    // Create the sale event
    const newEvent = await db
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
      })
      .returning();

    // Create event items and deduct stock
    for (const item of items) {
      // Insert event item
      await db.insert(eventItemsTable).values({
        eventId: newEvent[0].id,
        itemId: Number(item.itemId),
        quantity: Number(item.quantity),
        unitPriceAtSale: Number(item.unitPriceAtSale),
      });

      // Deduct stock
      await db
        .update(itemsTable)
        .set({ quantity: sql`quantity - ${Number(item.quantity)}` })
        .where(eq(itemsTable.id, Number(item.itemId)));
    }

    // Check for low stock and create notifications
    for (const item of items) {
      const itemData = await db
        .select()
        .from(itemsTable)
        .where(eq(itemsTable.id, Number(item.itemId)))
        .limit(1);

      if (itemData[0] && itemData[0].reorderThreshold && itemData[0].quantity <= itemData[0].reorderThreshold) {
        // Get admin users to notify
        const admins = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.role, 'admin'));

        for (const admin of admins) {
          await db.insert(notificationsTable).values({
            userId: admin.id,
            type: 'low_stock',
            title: 'Low Stock Alert',
            body: `${itemData[0].name} is running low (${itemData[0].quantity} remaining)`,
            relatedItemId: Number(item.itemId),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      event: newEvent[0],
      message: 'Payment processed successfully',
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process checkout' },
      { status: 500 }
    );
  }
}
