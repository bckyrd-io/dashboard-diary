import { db } from '../../../drizzle/db';
import { itemsTable } from '../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq, ilike, and, SQL } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const subCategory = searchParams.get('sub_category');
    const branchId = searchParams.get('branch_id');
    const search = searchParams.get('search');

    const conditions: SQL[] = [];

    if (category) {
      conditions.push(eq(itemsTable.category, category));
    }
    if (subCategory) {
      conditions.push(eq(itemsTable.subCategory, subCategory));
    }
    if (branchId) {
      conditions.push(eq(itemsTable.branchId, Number(branchId)));
    }
    if (search) {
      conditions.push(ilike(itemsTable.name, `%${search}%`));
    }

    const items = conditions.length > 0
      ? await db.select().from(itemsTable).where(and(...conditions))
      : await db.select().from(itemsTable);

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, category, subCategory, barcode, sku, price, costPrice, quantity, unit, reorderThreshold, imageUrl, branchId } = body;

  try {
    const newItem = await db
      .insert(itemsTable)
      .values({
        name,
        category: category || 'physical-product',
        subCategory,
        barcode,
        sku,
        price: Number(price),
        costPrice: costPrice ? Number(costPrice) : undefined,
        quantity: quantity ? Number(quantity) : 0,
        unit,
        reorderThreshold: reorderThreshold ? Number(reorderThreshold) : undefined,
        imageUrl,
        branchId: branchId ? Number(branchId) : undefined,
      })
      .returning();

    return NextResponse.json({ success: true, item: newItem[0] });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, name, category, subCategory, barcode, sku, price, costPrice, quantity, unit, reorderThreshold, imageUrl, branchId } = body;

  try {
    const updatedItem = await db
      .update(itemsTable)
      .set({
        name,
        category,
        subCategory,
        barcode,
        sku,
        price: Number(price),
        costPrice: costPrice ? Number(costPrice) : undefined,
        quantity: quantity !== undefined ? Number(quantity) : undefined,
        unit,
        reorderThreshold: reorderThreshold ? Number(reorderThreshold) : undefined,
        imageUrl,
        branchId: branchId ? Number(branchId) : undefined,
      })
      .where(eq(itemsTable.id, Number(id)))
      .returning();

    if (!updatedItem || updatedItem.length === 0) {
      return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updatedItem[0] });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();

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
