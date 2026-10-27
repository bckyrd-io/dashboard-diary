import { db } from '../../../drizzle/db';
import { categoriesTable } from '../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const categories = await db
      .select()
      .from(categoriesTable)
      .orderBy(asc(categoriesTable.name));

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (!trimmed) {
      return NextResponse.json({ success: false, message: 'Category name is required' }, { status: 400 });
    }

    // Idempotent: return the existing row when the name already exists
    const existing = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.name, trimmed));

    if (existing.length > 0) {
      return NextResponse.json({ success: true, category: existing[0] });
    }

    const inserted = await db
      .insert(categoriesTable)
      .values({ name: trimmed })
      .returning();

    return NextResponse.json({ success: true, category: inserted[0] });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
