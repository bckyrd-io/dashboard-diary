import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../drizzle/db';
import { usersTable } from '../../../drizzle/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs'; // For password hashing

// Roles a user can be created with (matches schema defaults / seed data)
const ALLOWED_ROLES = ['admin', 'Staff', 'Cashier'];

// Handle POST requests to create a new user
export async function POST(req: NextRequest) {
    const { username, email, password, branchId, profilePicture, role } = await req.json();

    // Validate required fields
    if (!username || !email || !password || !branchId) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Resolve the requested role case-insensitively; default to Staff
    const requestedRole = typeof role === 'string' ? role.trim().toLowerCase() : '';
    const resolvedRole = ALLOWED_ROLES.find((r) => r.toLowerCase() === requestedRole) ?? 'Staff';
    try {
        // Hash the password before saving it
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const [user] = await db.insert(usersTable).values({
            username,
            email,
            passwordHash, // Store hashed password
            role: resolvedRole,
            branchId: Number(branchId),
            image: profilePicture || null, // Save the image URL (or null if no image)
        }).returning({ id: usersTable.id });

        // Send the inserted user as response
        return NextResponse.json(user, { status: 200 });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error creating user:", error);
            return NextResponse.json({ message: 'Error creating user', error: error.message }, { status: 500 });
        } else {
            console.error("Unknown error occurred during user creation");
            return NextResponse.json({ message: 'Error creating user', error: 'Unknown error' }, { status: 500 });
        }
    }
}

// Get users. When ?userId= is provided, the role is resolved server-side:
// admins receive the full list; staff/cashier users receive only their own row.
// Without a userId (web admin pages) the full list is returned for compatibility.
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        // Never expose password hashes to clients
        const safeColumns = {
            id: usersTable.id,
            username: usersTable.username,
            email: usersTable.email,
            role: usersTable.role,
            branchId: usersTable.branchId,
            createdAt: usersTable.createdAt,
        };

        if (userId) {
            const requester = await db
                .select({ role: usersTable.role })
                .from(usersTable)
                .where(eq(usersTable.id, Number(userId)))
                .limit(1);

            const isAdmin = requester.length > 0 && requester[0].role.trim().toLowerCase() === 'admin';

            if (!isAdmin) {
                const self = await db
                    .select(safeColumns)
                    .from(usersTable)
                    .where(eq(usersTable.id, Number(userId)))
                    .limit(1);
                return NextResponse.json({ success: true, users: self });
            }
        }

        const users = await db.select(safeColumns).from(usersTable);
        return NextResponse.json({ success: true, users });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
        } else {
            console.error('Unknown error occurred while fetching users');
            return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
        }
    }
}
