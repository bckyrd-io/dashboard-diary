import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load environment variables from .env.development.local, .env.local, or .env
config({ path: '.env.development.local' });
config({ path: '.env.local' });
config({ path: '.env' });

export default defineConfig({
  schema: './drizzle/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/dashboard_diary',
  },
});
