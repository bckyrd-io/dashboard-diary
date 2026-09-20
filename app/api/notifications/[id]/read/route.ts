import { db } from '../../../../../drizzle/db';
import { notificationsTable } from '../../../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const updatedNotification = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.id, Number(id)))
      .returning();

    if (!updatedNotification || updatedNotification.length === 0) {
      return NextResponse.json({ success: false, message: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification: updatedNotification[0] });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
