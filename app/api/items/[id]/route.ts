import { db } from '../../../../drizzle/db';
import { itemsTable } from '../../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

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

    return NextResponse.json({ success: true, item: item[0] });
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
      .set(body)
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
