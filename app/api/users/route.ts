import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../drizzle/db';
import { usersTable } from '../../../drizzle/db/schema';
import bcrypt from 'bcryptjs'; // For password hashing

// Handle POST requests to create a new user
export async function POST(req: NextRequest) {
    const { username, email, password, branchId, profilePicture } = await req.json();
    console.log("the problem is here 0");
    // Validate required fields
    if (!username || !email || !password || !branchId) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    console.log("the problem is here 1");
    // Set default role
    const role: string = "Staff";
    try {
        // Hash the password before saving it
        const passwordHash = await bcrypt.hash(password, 10);

        console.log("the problem is here 2");
        // Insert the new user into the database
        const [user] = await db.insert(usersTable).values({
            username,
            email,
            passwordHash, // Store hashed password
            role,
            branchId,
            image: profilePicture || null, // Save the image URL (or null if no image)
        }).returning();

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

// Get all resources
export async function GET() {
    try {
        const users = await db.select().from(usersTable);
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
