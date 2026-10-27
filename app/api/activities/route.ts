import { db } from '../../../drizzle/db';
import { eventsTable, schedulesTable } from '../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const { description, activityType, amount, activityDate, clientOpId } = await req.json();

  try {
    // Offline replay idempotency
    if (clientOpId) {
      const existing = await db
        .select()
        .from(eventsTable)
        .where(eq(eventsTable.clientOpId, String(clientOpId)))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json({ success: true, activity: existing, duplicate: true });
      }
    }

    const newActivity = await db
      .insert(eventsTable)
      .values({
        description,
        eventType: 'adjustment',
        financialType: activityType || 'Neutral',
        amount: Number(amount),
        date: activityDate,
        clientOpId: clientOpId ? String(clientOpId) : undefined,
      })
      .returning();

    if (new Date(activityDate) > new Date()) {
      await db.insert(schedulesTable).values({
        activityId: newActivity[0].id,
        scheduledDate: activityDate,
        notificationMessage: `Upcoming activity: ${description} on ${activityDate}`,
      });
    }

    return NextResponse.json({ success: true, activity: newActivity });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const activities = await db.select().from(eventsTable);
    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { id, description, activityType, amount, activityDate } = await req.json();

  try {
    const updatedActivity = await db
      .update(eventsTable)
      .set({
        description,
        financialType: activityType || 'Neutral',
        amount: Number(amount),
        date: activityDate,
      })
      .where(eq(eventsTable.id, Number(id)))
      .returning();

    if (!updatedActivity || updatedActivity.length === 0) {
      return NextResponse.json({ success: false, message: 'Activity not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, activity: updatedActivity });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();

  try {
    const deletedCount = await db
      .delete(eventsTable)
      .where(eq(eventsTable.id, Number(id)))
      .returning();

    if (!deletedCount || deletedCount.length === 0) {
      return NextResponse.json({ success: false, message: 'Activity not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Activity deleted' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
