import { NextResponse } from 'next/server';
import { db } from '../../../drizzle/db';
import {
  activitiesTable,
  activityResourcesTable,
  branchesTable,
  performanceTable,
  resourcesTable,
  schedulesTable,
  usersTable,
} from '../../../drizzle/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Fetch aggregated activity data grouped by activity_type
    const activitiesByType = await db
      .select({
        activityType: activitiesTable.activityType,
        totalAmount: sql<number>`COALESCE(SUM(${activitiesTable.amount})::int, 0)`,
        revenueAmount: sql<number>`COALESCE(SUM(CASE WHEN LOWER(${activitiesTable.activityType}) = 'revenue' THEN ${activitiesTable.amount} ELSE 0 END)::int, 0)`,
        expenseAmount: sql<number>`COALESCE(SUM(CASE WHEN LOWER(${activitiesTable.activityType}) = 'expense' THEN ${activitiesTable.amount} ELSE 0 END)::int, 0)`,
        netProfit: sql<number>`(COALESCE(SUM(CASE WHEN LOWER(${activitiesTable.activityType}) = 'revenue' THEN ${activitiesTable.amount} ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN LOWER(${activitiesTable.activityType}) = 'expense' THEN ${activitiesTable.amount} ELSE 0 END), 0))::int`,
        activities: sql<string>`COALESCE(STRING_AGG(${activitiesTable.description}, ', '), '')`,
      })
      .from(activitiesTable)
      .where(sql`LOWER(${activitiesTable.activityType}) != 'neutral'`)
      .groupBy(activitiesTable.activityType);

    // Fetch detailed activity list grouped by activity ID
    const activitiesList = await db
      .select({
        activityId: activitiesTable.id,
        activityType: activitiesTable.activityType,
        description: activitiesTable.description,
        amount: activitiesTable.amount,
        createdAt: activitiesTable.createdAt,
        resourcesUsed: sql<string>`COALESCE(STRING_AGG(DISTINCT 
            CASE WHEN ${resourcesTable.name} IS NOT NULL 
                 THEN CONCAT(${resourcesTable.name}, ' (', ${activityResourcesTable.allocatedQuantity}, ' ', ${resourcesTable.unit}, ')') 
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
      .from(activitiesTable)
      .leftJoin(activityResourcesTable, sql`${activityResourcesTable.activityId} = ${activitiesTable.id}`)
      .leftJoin(resourcesTable, sql`${resourcesTable.id} = ${activityResourcesTable.resourceId}`)
      .leftJoin(performanceTable, sql`${performanceTable.activityId} = ${activitiesTable.id}`)
      .leftJoin(usersTable, sql`${usersTable.id} = ${performanceTable.userId}`)
      .leftJoin(branchesTable, sql`${branchesTable.id} = ${usersTable.branchId}`)
      .leftJoin(schedulesTable, sql`${schedulesTable.activityId} = ${activitiesTable.id}`)
      .groupBy(
        activitiesTable.id,
        activitiesTable.activityType,
        activitiesTable.description,
        activitiesTable.amount,
        activitiesTable.createdAt
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
