import { db } from '../../../drizzle/db';
import { schedulesTable, eventsTable } from '../../../drizzle/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const schedules = await db
            .select({
                scheduleId: schedulesTable.id,
                scheduledDate: schedulesTable.scheduledDate,
                activityDescription: eventsTable.description,
            })
            .from(schedulesTable)
            .leftJoin(eventsTable, eq(eventsTable.id, schedulesTable.activityId));

        const events = schedules.map((schedule) => ({
            id: schedule.scheduleId?.toString() ?? '',
            title: schedule.activityDescription ?? 'Untitled Activity',
            start: schedule.scheduledDate ? new Date(schedule.scheduledDate).toISOString() : '',
        }));

        return NextResponse.json({ 
            success: true, 
            events,
            total: events.length 
        });
    } catch (error) {
        console.error('Error fetching schedules:', error);
        
        return NextResponse.json(
            { 
                success: false, 
                message: error instanceof Error ? error.message : 'Unknown server error',
                events: [] 
            },
            { status: 500 }
        );
    }
}
