import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

<<<<<<< Updated upstream
=======
// Load environment variables from .env.development.local, .env.local, or .env
config({ path: '.env.development.local' });
config({ path: '.env.local' });
>>>>>>> Stashed changes
config({ path: '.env' });

export default defineConfig({
  schema: './drizzle/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
<<<<<<< Updated upstream
    url: process.env.POSTGRES_URL!,
=======
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/dashboard_diary',
>>>>>>> Stashed changes
  },
});
