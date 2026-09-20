import { db } from '../../../drizzle/db';
import { eventsTable, eventItemsTable, itemsTable, branchesTable } from '../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq, and, or, SQL, sql } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get('event_type');
    const branchId = searchParams.get('branch_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    const conditions: SQL[] = [];

    if (eventType) {
      conditions.push(eq(eventsTable.eventType, eventType));
    }
    if (branchId) {
      conditions.push(
        or(
          eq(eventsTable.branchId, Number(branchId)),
          eq(eventsTable.toBranchId, Number(branchId))
        )!
      );
    }

    const events = conditions.length > 0
      ? await db.select().from(eventsTable).where(and(...conditions))
      : await db.select().from(eventsTable);

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    eventType,
    financialType,
    description,
    amount,
    date,
    branchId,
    toBranchId,
    paymentMethod,
    paymentReference,
    paymentStatus,
    isRecurring,
    recurrenceRule,
    items,
  } = body;

  try {
    // If it's a transfer, validate branches
    if (eventType === 'transfer') {
      if (!branchId || !toBranchId) {
        return NextResponse.json(
          { success: false, message: 'Source branch and destination branch are required for stock transfer.' },
          { status: 400 }
        );
      }
      if (Number(branchId) === Number(toBranchId)) {
        return NextResponse.json(
          { success: false, message: 'Source and destination branches cannot be the same.' },
          { status: 400 }
        );
      }
    }

    const newEvent = await db
      .insert(eventsTable)
      .values({
        eventType,
        financialType: financialType || (eventType === 'sale' ? 'Revenue' : 'Neutral'),
        description: description || (eventType === 'transfer' ? 'Stock Transfer' : `${eventType} event`),
        amount: Number(amount) || 0,
        date: date || new Date().toISOString().split('T')[0],
        branchId: branchId ? Number(branchId) : undefined,
        toBranchId: toBranchId ? Number(toBranchId) : undefined,
        paymentMethod,
        paymentReference,
        paymentStatus: paymentStatus || 'success',
        isRecurring: isRecurring || false,
        recurrenceRule,
      })
      .returning();

    // Insert event items if provided
    if (items && items.length > 0) {
      const eventItems = items.map((item: { itemId: number; quantity: number; unitPriceAtSale?: number }) => ({
        eventId: newEvent[0].id,
        itemId: Number(item.itemId),
        quantity: Number(item.quantity),
        unitPriceAtSale: Number(item.unitPriceAtSale) || 0,
      }));

      await db.insert(eventItemsTable).values(eventItems);

      // Calculate total amount from items if not provided
      if (!amount || Number(amount) === 0) {
        const totalAmount = items.reduce(
          (sum: number, item: { quantity: number; unitPriceAtSale?: number }) =>
            sum + Number(item.quantity) * (Number(item.unitPriceAtSale) || 0),
          0
        );

        await db
          .update(eventsTable)
          .set({ amount: totalAmount })
          .where(eq(eventsTable.id, newEvent[0].id));

        newEvent[0].amount = totalAmount;
      }

      // Deduct stock for sales
      if (eventType === 'sale') {
        for (const item of items) {
          await db
            .update(itemsTable)
            .set({ quantity: sql`quantity - ${Number(item.quantity)}` })
            .where(eq(itemsTable.id, Number(item.itemId)));
        }
      }

      // Add stock for receiving
      if (eventType === 'receiving') {
        for (const item of items) {
          await db
            .update(itemsTable)
            .set({ quantity: sql`quantity + ${Number(item.quantity)}` })
            .where(eq(itemsTable.id, Number(item.itemId)));
        }
      }

      // Handle stock transfer between branches
      if (eventType === 'transfer' && branchId && toBranchId) {
        for (const item of items) {
          const qty = Number(item.quantity);
          // Get source item details
          const sourceRows = await db
            .select()
            .from(itemsTable)
            .where(eq(itemsTable.id, Number(item.itemId)))
            .limit(1);

          if (sourceRows.length > 0) {
            const src = sourceRows[0];
            // Deduct stock from source branch item
            await db
              .update(itemsTable)
              .set({ quantity: sql`quantity - ${qty}` })
              .where(eq(itemsTable.id, src.id));

            // Check if destination branch already has this item (by name)
            const destRows = await db
              .select()
              .from(itemsTable)
              .where(
                and(
                  eq(itemsTable.branchId, Number(toBranchId)),
                  eq(itemsTable.name, src.name)
                )
              )
              .limit(1);

            if (destRows.length > 0) {
              // Add to existing destination item quantity
              await db
                .update(itemsTable)
                .set({ quantity: sql`quantity + ${qty}` })
                .where(eq(itemsTable.id, destRows[0].id));
            } else {
              // Create new item entry for destination branch
              await db.insert(itemsTable).values({
                name: src.name,
                category: src.category,
                subCategory: src.subCategory,
                barcode: src.barcode ? `${src.barcode}-B${toBranchId}` : null,
                sku: src.sku,
                price: src.price,
                costPrice: src.costPrice,
                quantity: qty,
                unit: src.unit,
                reorderThreshold: src.reorderThreshold,
                imageUrl: src.imageUrl,
                branchId: Number(toBranchId),
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, event: newEvent[0] });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
