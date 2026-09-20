import { NextResponse } from 'next/server';
import { db } from '../../../drizzle/db';
import {
  eventsTable,
  eventItemsTable,
  itemsTable,
  branchesTable,
  performanceTable,
  schedulesTable,
  usersTable,
} from '../../../drizzle/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Fetch aggregated activity data grouped by financial_type (Revenue/Expense/Neutral)
    const activitiesByType = await db
      .select({
        activityType: eventsTable.financialType,
        totalAmount: sql<number>`COALESCE(SUM(${eventsTable.amount})::int, 0)`,
        activities: sql<string>`COALESCE(STRING_AGG(${eventsTable.description}, ', '), '')`,
      })
      .from(eventsTable)
      .where(sql`LOWER(${eventsTable.financialType}) != 'neutral'`)
      .groupBy(eventsTable.financialType);

    // Fetch detailed activity list
    const activitiesList = await db
      .select({
        activityId: eventsTable.id,
        activityType: eventsTable.financialType,
        description: eventsTable.description,
        amount: eventsTable.amount,
        createdAt: eventsTable.createdAt,
        resourcesUsed: sql<string>`COALESCE(STRING_AGG(DISTINCT 
            CASE WHEN ${itemsTable.name} IS NOT NULL 
                 THEN CONCAT(${itemsTable.name}, ' (', ${eventItemsTable.quantity}, ' ', COALESCE(${itemsTable.unit}, 'units'), ')') 
            END, 
            ', '), '')`,
        assignedStaff: sql<string>`COALESCE(STRING_AGG(DISTINCT
            CASE WHEN ${usersTable.username} IS NOT NULL 
                 THEN CONCAT(${usersTable.username}, ' [', ${performanceTable.status}, ']') 
            END, 
            ', '), '')`,
        upcomingDates: sql<string>`COALESCE(STRING_AGG(DISTINCT
            CASE WHEN ${schedulesTable.scheduledDate} IS NOT NULL 
                 THEN TO_CHAR(${schedulesTable.scheduledDate}, 'YYYY-MM-DD') 
            END, 
            ', '), '')`,
        involvedBranches: sql<string>`COALESCE(STRING_AGG(DISTINCT 
            CASE WHEN ${branchesTable.location} IS NOT NULL 
                 THEN ${branchesTable.location} 
            END, 
            ', '), '')`,
      })
      .from(eventsTable)
      .leftJoin(eventItemsTable, sql`${eventItemsTable.eventId} = ${eventsTable.id}`)
      .leftJoin(itemsTable, sql`${itemsTable.id} = ${eventItemsTable.itemId}`)
      .leftJoin(performanceTable, sql`${performanceTable.activityId} = ${eventsTable.id}`)
      .leftJoin(usersTable, sql`${usersTable.id} = ${performanceTable.userId}`)
      .leftJoin(branchesTable, sql`${branchesTable.id} = ${usersTable.branchId}`)
      .leftJoin(schedulesTable, sql`${schedulesTable.activityId} = ${eventsTable.id}`)
      .groupBy(
        eventsTable.id,
        eventsTable.financialType,
        eventsTable.description,
        eventsTable.amount,
        eventsTable.createdAt
      );

    // Fetch notifications from the schedules table
    const notifications = await db
      .select({
        notificationMessage: schedulesTable.notificationMessage,
      })
      .from(schedulesTable);

    return NextResponse.json({
      activitiesByType,
      activitiesList,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
