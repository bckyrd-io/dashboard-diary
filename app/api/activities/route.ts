import { db } from '../../../drizzle/db';
import { activitiesTable, schedulesTable } from '../../../drizzle/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';


export async function POST(req: Request) {
    const { description, activityType, amount, activityDate } = await req.json();
  
    try {
      // Insert the activity
      const newActivity = await db.insert(activitiesTable).values({
        description,
        activityType,
        amount,
        activityDate,
      }).returning();
  
      // If activityDate is in the future, create a schedule
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
  

// Get all activities
export async function GET() {
    try {
        const activities = await db.select().from(activitiesTable);
        return NextResponse.json({ success: true, activities });
    } catch (error) {
        console.error('Error fetching activities:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

// Update an activity
export async function PUT(req: Request) {
    const { id, description, activityType, amount, activityDate } = await req.json();

    try {
        const updatedActivity = await db
            .update(activitiesTable)
            .set({ description, activityType, amount, activityDate })
            .where(eq(activitiesTable.id, id));

        if (!updatedActivity) {
            return NextResponse.json({ success: false, message: 'Activity not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, activity: updatedActivity });
    } catch (error) {
        console.error('Error updating activity:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

// Delete an activity
export async function DELETE(req: Request) {
    const { id } = await req.json();

    try {
        const deletedCount = await db.delete(activitiesTable).where(eq(activitiesTable.id, id));

        if (!deletedCount) {
            return NextResponse.json({ success: false, message: 'Activity not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Activity deleted' });
    } catch (error) {
        console.error('Error deleting activity:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
