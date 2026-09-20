import { db } from '../../../drizzle/db';
import { notificationsTable } from '../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq, and, SQL } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const unreadOnly = searchParams.get('unread_only');

    const conditions: SQL[] = [];

    if (userId) {
      conditions.push(eq(notificationsTable.userId, Number(userId)));
    }
    if (unreadOnly === 'true') {
      conditions.push(eq(notificationsTable.isRead, false));
    }

    const notifications = conditions.length > 0
      ? await db.select().from(notificationsTable).where(and(...conditions))
      : await db.select().from(notificationsTable);

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, type, title, body: notificationBody, relatedEventId, relatedItemId } = body;

  try {
    const newNotification = await db
      .insert(notificationsTable)
      .values({
        userId: Number(userId),
        type,
        title,
        body: notificationBody,
        relatedEventId: relatedEventId ? Number(relatedEventId) : undefined,
        relatedItemId: relatedItemId ? Number(relatedItemId) : undefined,
      })
      .returning();

    return NextResponse.json({ success: true, notification: newNotification[0] });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
