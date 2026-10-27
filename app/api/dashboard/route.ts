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
import { sql, eq, and } from 'drizzle-orm';

// Determines whether the requesting user may see ALL dashboard data.
// Admins see everything; staff/cashier users only see the activities they are
// assigned to (rows in the performance table linking that user to an event).
// The role is looked up server-side from the DB so the client cannot fake it.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let eventsCondition = sql`TRUE`;
    let isAdmin = true;

    if (userId) {
      const user = await db
        .select({ role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.id, Number(userId)))
        .limit(1);

      if (user.length > 0) {
        isAdmin = user[0].role.trim().toLowerCase() === 'admin';
      } else {
        // Unknown user id: treat as fully restricted rather than leaking data
        isAdmin = false;
      }

      if (!isAdmin) {
        // Only events that have a performance row for this user ("data about them")
        eventsCondition = sql`${eventsTable.id} IN (
          SELECT ${performanceTable.activityId}
          FROM ${performanceTable}
          WHERE ${performanceTable.userId} = ${Number(userId)}
        )`;
      }
    }
    // Fetch aggregated activity data grouped by financial_type (Revenue/Expense/Neutral)
    const activitiesByType = await db
      .select({
        activityType: eventsTable.financialType,
        totalAmount: sql<number>`COALESCE(SUM(${eventsTable.amount})::int, 0)`,
        activities: sql<string>`COALESCE(STRING_AGG(${eventsTable.description}, ', '), '')`,
      })
      .from(eventsTable)
      .where(and(eventsCondition, sql`LOWER(${eventsTable.financialType}) != 'neutral'`))
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
      .where(eventsCondition)
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
