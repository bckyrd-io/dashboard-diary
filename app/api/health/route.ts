import { NextResponse } from 'next/server';

// Public, unauthenticated liveness probe. Used by the mobile app's LAN server
// discovery (subnet scan) and the "Test connection" button to confirm that a
// candidate http://<ip>:3000 address is really this API before saving it.
// Deliberately does not touch the database so it stays fast and dependency-free.
export async function GET() {
  return NextResponse.json({ ok: true, service: 'dashboard-api' });
}
