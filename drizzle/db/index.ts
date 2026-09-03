<<<<<<< Updated upstream
import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { config } from 'dotenv';
import * as schema from './schema';

config({ path: '.env' });

export const db = drizzle(sql, { schema });
=======
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from 'dotenv';
import * as schema from './schema';

// Load environment variables
config({ path: '.env.development.local' });
config({ path: '.env.local' });
config({ path: '.env' });

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgresql://postgres:postgres@localhost:5432/dashboard_diary';

// Prevent multiple pool instances during Next.js hot reloading
const globalForDb = globalThis as unknown as {
  pgPool: Pool | undefined;
};

export const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString,
    ssl:
      connectionString.includes('sslmode=require') ||
      connectionString.includes('neon.tech') ||
      connectionString.includes('supabase.co')
        ? { rejectUnauthorized: false }
        : undefined,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgPool = pool;
}

// Initialize Drizzle ORM with the PostgreSQL connection pool and schema
export const db = drizzle(pool, { schema });
>>>>>>> Stashed changes
