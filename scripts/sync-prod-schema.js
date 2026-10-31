// Temporary one-off: sync missing schema objects to the production database.
// Runs during the Vercel build because that is the only place the sensitive
// DATABASE_URL exists (it cannot be read from the Vercel API/dashboard).
// Only additive, idempotent DDL — never drops or modifies existing objects.
const { Pool } = require('pg');

const EXPECTED_TABLES = [
  'branches',
  'users',
  'items',
  'categories',
  'events',
  'event_items',
  'schedules',
  'performance',
  'notifications',
];

const ADDITIVE_DDL = [
  // categories catalog (added in d5fc91c)
  `CREATE TABLE IF NOT EXISTS categories (
     id serial PRIMARY KEY,
     name varchar(100) NOT NULL UNIQUE,
     created_at timestamp NOT NULL DEFAULT now()
   )`,
  // offline replay idempotency columns (added in d5fc91c)
  `ALTER TABLE items ADD COLUMN IF NOT EXISTS client_op_id varchar(100)`,
  `ALTER TABLE events ADD COLUMN IF NOT EXISTS client_op_id varchar(100)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS items_client_op_id_unique ON items (client_op_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS events_client_op_id_unique ON events (client_op_id)`,
  // notifications table (NEW in schema) if it is also absent
  `CREATE TABLE IF NOT EXISTS notifications (
     id serial PRIMARY KEY,
     user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     type varchar(50) NOT NULL,
     title varchar(255) NOT NULL,
     body text NOT NULL,
     is_read boolean DEFAULT false,
     related_event_id integer REFERENCES events(id),
     related_item_id integer REFERENCES items(id),
     created_at timestamp NOT NULL DEFAULT now()
   )`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('[schema-sync] DATABASE_URL is not set in this environment');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: url,
    ssl: url.includes('sslmode=require') || url.includes('neon.tech')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  const before = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`
  );
  const present = new Set(before.rows.map((r) => r.table_name));
  console.log('[schema-sync] tables present:', [...present].join(', '));
  const missingTables = EXPECTED_TABLES.filter((t) => !present.has(t));
  console.log('[schema-sync] missing expected tables:', missingTables.join(', ') || '(none)');

  const colCheck = await pool.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema='public' AND column_name='client_op_id'`
  );
  console.log(
    '[schema-sync] client_op_id present on:',
    colCheck.rows.map((r) => r.table_name).join(', ') || '(none)'
  );

  for (const stmt of ADDITIVE_DDL) {
    const label = stmt.split('\n')[0].replace(/\s+/g, ' ').slice(0, 80);
    try {
      await pool.query(stmt);
      console.log('[schema-sync] OK:', label);
    } catch (err) {
      console.error('[schema-sync] FAILED:', label, '->', err.message);
      throw err;
    }
  }

  const after = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`
  );
  const cols = await pool.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema='public' AND column_name='client_op_id' ORDER BY 1`
  );
  console.log('[schema-sync] final tables:', after.rows.map((r) => r.table_name).join(', '));
  console.log('[schema-sync] final client_op_id on:', cols.rows.map((r) => r.table_name).join(', '));
  console.log('[schema-sync] done');

  await pool.end();
}

main().catch((err) => {
  console.error('[schema-sync] fatal:', err);
  process.exit(1);
});
