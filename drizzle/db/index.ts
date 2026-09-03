import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from 'dotenv';
import * as schema from './schema';

// Load pg at runtime without requiring its type declarations during compilation.
const pg = require('pg') as {
  Pool: new (options: {
    connectionString: string;
    ssl?: { rejectUnauthorized: boolean };
  }) => any;
};
const { Pool } = pg;

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
  pgPool: InstanceType<typeof Pool> | undefined;
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
