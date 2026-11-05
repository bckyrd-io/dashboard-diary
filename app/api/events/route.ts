import { db } from '../../../drizzle/db';
import { eventsTable, eventItemsTable, itemsTable, branchesTable, schedulesTable } from '../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq, and, or, SQL, sql } from 'drizzle-orm';
import { assertStockAvailable, deductStock, addStock, StockError } from '../../../lib/stock';

// Events dated today or later also appear on the calendar via a schedule row.
function isSchedulable(date?: string): boolean {
  if (!date) return false;
  const today = new Date().toISOString().split('T')[0];
  return date >= today;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get('event_type');
    const branchId = searchParams.get('branch_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const includeItems = searchParams.get('includeItems') === 'true';

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

    // Offline sync/backup pulls need the line items for sales/transfers in a
    // single request. Default response shape is unchanged.
    if (includeItems) {
      const eventItems = await db.select().from(eventItemsTable);
      return NextResponse.json({ success: true, events, eventItems });
    }

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
    clientOpId,
  } = body;

  try {
    // Offline replay idempotency
    if (clientOpId) {
      const existingEvent = await db
        .select()
        .from(eventsTable)
        .where(eq(eventsTable.clientOpId, String(clientOpId)))
        .limit(1);

      if (existingEvent.length > 0) {
        return NextResponse.json({ success: true, event: existingEvent[0], duplicate: true });
      }
    }

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

    const newEvent = await db.transaction(async (tx) => {
      // Validate stock availability up front so a bad cart never writes rows.
      if (items && items.length > 0) {
        if (eventType === 'sale') {
          await assertStockAvailable(items, {}, tx);
        } else if (eventType === 'transfer' && branchId) {
          await assertStockAvailable(items, { branchId: Number(branchId) }, tx);
        }
      }

      const inserted = await tx
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
          clientOpId: clientOpId ? String(clientOpId) : undefined,
        })
        .returning();

      // Calendar sync: dated events (today or future) show up on Schedule screens.
      // Skipped for sales — checkout creates those after payment and they're history.
      if (eventType !== 'sale' && isSchedulable(date || new Date().toISOString().split('T')[0])) {
        await tx.insert(schedulesTable).values({
          activityId: inserted[0].id,
          scheduledDate: date || new Date().toISOString().split('T')[0],
          notificationMessage: `Upcoming: ${inserted[0].description}`,
        });
      }

      // Insert event items if provided
      if (items && items.length > 0) {
        const eventItems = items.map((item: { itemId: number; quantity: number; unitPriceAtSale?: number }) => ({
          eventId: inserted[0].id,
          itemId: Number(item.itemId),
          quantity: Number(item.quantity),
          unitPriceAtSale: Number(item.unitPriceAtSale) || 0,
        }));

        await tx.insert(eventItemsTable).values(eventItems);

        // Calculate total amount from items if not provided
        if (!amount || Number(amount) === 0) {
          const totalAmount = items.reduce(
            (sum: number, item: { quantity: number; unitPriceAtSale?: number }) =>
              sum + Number(item.quantity) * (Number(item.unitPriceAtSale) || 0),
            0
          );

          await tx
            .update(eventsTable)
            .set({ amount: totalAmount })
            .where(eq(eventsTable.id, inserted[0].id));

          inserted[0].amount = totalAmount;
        }

        // Deduct stock for sales (guarded: fails with 409 if stock ran out)
        if (eventType === 'sale') {
          for (const item of items) {
            await deductStock(tx, Number(item.itemId), Number(item.quantity));
          }
        }

        // Add stock for receiving
        if (eventType === 'receiving') {
          for (const item of items) {
            await addStock(tx, Number(item.itemId), Number(item.quantity));
          }
        }

        // Handle stock transfer between branches
        if (eventType === 'transfer' && branchId && toBranchId) {
          for (const item of items) {
            const qty = Number(item.quantity);
            // Get source item details
            const sourceRows = await tx
              .select()
              .from(itemsTable)
              .where(eq(itemsTable.id, Number(item.itemId)))
              .limit(1);

            if (sourceRows.length > 0) {
              const src = sourceRows[0];
              // Deduct stock from source branch item (guarded, already
              // pre-validated against the source branch above)
              await deductStock(tx, src.id, qty);

              // Destination matches on the normalized name so case/whitespace
              // differences never create a duplicate row for the same product.
              const destRows = await tx
                .select()
                .from(itemsTable)
                .where(
                  and(
                    eq(itemsTable.branchId, Number(toBranchId)),
                    sql`lower(btrim(${itemsTable.name})) = lower(btrim(${src.name}))`
                  )
                )
                .limit(1);

              if (destRows.length > 0) {
                // Add to existing destination item quantity
                await tx
                  .update(itemsTable)
                  .set({ quantity: sql`quantity + ${qty}` })
                  .where(eq(itemsTable.id, destRows[0].id));
              } else {
                // No destination row yet. The barcode column is unique, so a
                // suffixed barcode left over from a deleted row must not blow
                // up the insert — fall back to no barcode in that case.
                let barcode: string | null = src.barcode ? `${src.barcode}-B${toBranchId}` : null;
                if (barcode) {
                  const clash = await tx
                    .select({ id: itemsTable.id })
                    .from(itemsTable)
                    .where(eq(itemsTable.barcode, barcode))
                    .limit(1);
                  if (clash.length > 0) barcode = null;
                }

                await tx.insert(itemsTable).values({
                  name: src.name,
                  category: src.category,
                  subCategory: src.subCategory,
                  barcode,
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

      return inserted[0];
    });

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    if (error instanceof StockError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error('Error creating event:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
