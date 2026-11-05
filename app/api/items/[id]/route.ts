import { db } from '../../../../drizzle/db';
import { itemsTable } from '../../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq, and, sql } from 'drizzle-orm';
import { StockError } from '../../../../lib/stock';

// PATCH accepts a partial item update — never trust the client with
// structural fields (id, branchId, timestamps) or negative stock.
const PATCHABLE_FIELDS = [
  'name',
  'category',
  'subCategory',
  'barcode',
  'sku',
  'price',
  'costPrice',
  'quantity',
  'unit',
  'reorderThreshold',
  'imageUrl',
] as const;

function sanitizePatch(body: Record<string, unknown>) {
  const allowed: Record<string, unknown> = {};
  for (const key of PATCHABLE_FIELDS) {
    if (body[key] !== undefined) allowed[key] = body[key];
  }

  if (allowed.quantity !== undefined) {
    const qty = Number(allowed.quantity);
    if (!Number.isInteger(qty) || qty < 0) {
      throw new StockError('Quantity must be a whole number of 0 or more', 400);
    }
    allowed.quantity = qty;
  }
  if (allowed.reorderThreshold !== undefined) {
    const threshold = Number(allowed.reorderThreshold);
    if (!Number.isInteger(threshold) || threshold < 0) {
      throw new StockError('Reorder threshold must be a whole number of 0 or more', 400);
    }
    allowed.reorderThreshold = threshold;
  }
  if (allowed.price !== undefined) {
    const price = Number(allowed.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new StockError('Price must be 0 or more', 400);
    }
    allowed.price = price;
  }

  return allowed;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const item = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.id, Number(id)))
      .limit(1);

    if (!item || item.length === 0) {
      return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
    }

    // The product may exist as one row per branch — the detail screen shows
    // the TOTAL across all of them, like the listing does.
    const row = item[0];
    const totals = await db
      .select({
        quantity: sql<number>`coalesce(sum(${itemsTable.quantity}), 0)::int`,
        branchCount: sql<number>`count(*)::int`,
        branchIds: sql<number[]>`array_agg(distinct coalesce(${itemsTable.branchId}, 0))`,
      })
      .from(itemsTable)
      .where(
        and(
          sql`lower(btrim(${itemsTable.name})) = lower(btrim(${row.name}::text))`,
          sql`coalesce(${itemsTable.category}::text, '') = coalesce(${row.category}::text, '')`,
          sql`coalesce(${itemsTable.subCategory}::text, '') = coalesce(${row.subCategory}::text, '')`
        )
      );

    return NextResponse.json({
      success: true,
      item: { ...row, ...totals[0] },
    });
  } catch (error) {
    console.error('Error fetching item:', error);
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
    const updatedItem = await db
      .update(itemsTable)
      .set(sanitizePatch(body))
      .where(eq(itemsTable.id, Number(id)))
      .returning();

    if (!updatedItem || updatedItem.length === 0) {
      return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updatedItem[0] });
  } catch (error) {
    if (error instanceof StockError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error('Error updating item:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const deletedCount = await db
      .delete(itemsTable)
      .where(eq(itemsTable.id, Number(id)))
      .returning();

    if (!deletedCount || deletedCount.length === 0) {
      return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
