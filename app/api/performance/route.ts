import { db } from "../../../drizzle/db";
import { performanceTable, eventsTable, usersTable, branchesTable } from "../../../drizzle/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");

        if (userId) {
            const performances = await db
                .select({
                    id: performanceTable.id,
                    userId: performanceTable.userId,
                    username: usersTable.username,
                    branch_name: branchesTable.name,
                    role: usersTable.role,
                    activity: eventsTable.description,
                    status: performanceTable.status,
                    updatedAt: performanceTable.updatedAt,
                })
                .from(usersTable)
                .leftJoin(performanceTable, eq(usersTable.id, performanceTable.userId))
                .leftJoin(branchesTable, eq(usersTable.branchId, branchesTable.id))
                .leftJoin(eventsTable, eq(performanceTable.activityId, eventsTable.id))
                .where(
                    and(
                        eq(usersTable.id, Number(userId)),
                        eq(usersTable.role, "Staff")
                    )
                );

            return NextResponse.json({ success: true, performance: performances }, {
                status: 200,
            });
        } else {
            const performances = await db
                .select({
                    id: performanceTable.id,
                    userId: usersTable.id,
                    username: usersTable.username,
                    branch_name: branchesTable.name,
                    role: usersTable.role,
                    activity: eventsTable.description,
                    status: performanceTable.status,
                    updatedAt: performanceTable.updatedAt,
                })
                .from(usersTable)
                .leftJoin(performanceTable, eq(usersTable.id, performanceTable.userId))
                .leftJoin(branchesTable, eq(usersTable.branchId, branchesTable.id))
                .leftJoin(eventsTable, eq(performanceTable.activityId, eventsTable.id))
                .where(eq(usersTable.role, "Staff"));

            return NextResponse.json({ success: true, performance: performances }, {
                status: 200,
            });
        }
    } catch (error) {
        console.error("Error fetching performance data:", error);
        return NextResponse.json({ success: false, message: "Server error" }, {
            status: 500,
        });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const newPerformance = await db.insert(performanceTable).values({
            userId: Number(body.userId),
            activityId: Number(body.activityId),
            status: body.status || "Assigned",
            updatedAt: new Date(),
        }).returning();

        return NextResponse.json({ success: true, performance: newPerformance }, {
            status: 201,
        });
    } catch (error) {
        console.error("Error creating performance entry:", error);
        return NextResponse.json({ success: false, message: "Server error" }, {
            status: 500,
        });
    }
}
