import { db } from '../../../drizzle/db';
import { workstationsTable } from '../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const workstations = await db.select().from(workstationsTable).orderBy(asc(workstationsTable.id));
    return NextResponse.json({ success: true, workstations });
  } catch (error) {
    console.error('Error fetching workstations:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
