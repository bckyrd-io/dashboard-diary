// SQLite schema for the mobile offline mirror.
// Mirrors the Postgres tables used by the API (users excludes password hashes)
// plus the sync bookkeeping tables.
export const SCHEMA_VERSION = 1;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY,
  name TEXT,
  location TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT,
  email TEXT,
  role TEXT,
  branchId INTEGER,
  createdAt TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE,
  createdAt TEXT
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY,
  name TEXT,
  category TEXT,
  subCategory TEXT,
  barcode TEXT,
  sku TEXT,
  price INTEGER,
  costPrice INTEGER,
  quantity INTEGER,
  unit TEXT,
  reorderThreshold INTEGER,
  imageUrl TEXT,
  branchId INTEGER,
  clientOpId TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  eventType TEXT,
  financialType TEXT,
  description TEXT,
  amount INTEGER,
  date TEXT,
  branchId INTEGER,
  toBranchId INTEGER,
  paymentMethod TEXT,
  paymentReference TEXT,
  paymentStatus TEXT,
  isRecurring INTEGER,
  recurrenceRule TEXT,
  clientOpId TEXT,
  createdAt TEXT
);

CREATE TABLE IF NOT EXISTS event_items (
  id INTEGER PRIMARY KEY,
  eventId INTEGER,
  itemId INTEGER,
  quantity INTEGER,
  unitPriceAtSale INTEGER,
  createdAt TEXT
);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY,
  activityId INTEGER,
  scheduledDate TEXT,
  notificationMessage TEXT,
  createdAt TEXT
);

CREATE TABLE IF NOT EXISTS performance (
  id INTEGER PRIMARY KEY,
  userId INTEGER,
  activityId INTEGER,
  status TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  userId INTEGER,
  type TEXT,
  title TEXT,
  body TEXT,
  isRead INTEGER,
  relatedEventId INTEGER,
  relatedItemId INTEGER,
  createdAt TEXT
);

CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  body TEXT,
  clientOpId TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL DEFAULT 'pending',
  lastError TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS id_map (
  entity TEXT NOT NULL,
  localId INTEGER NOT NULL,
  serverId INTEGER NOT NULL,
  PRIMARY KEY (entity, localId)
);

CREATE TABLE IF NOT EXISTS api_cache (
  url TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_items_name ON items (name);
CREATE INDEX IF NOT EXISTS idx_items_branch ON items (branchId);
CREATE INDEX IF NOT EXISTS idx_events_type_date ON events (eventType, date);
CREATE INDEX IF NOT EXISTS idx_events_client_op ON events (clientOpId);
CREATE INDEX IF NOT EXISTS idx_items_client_op ON items (clientOpId);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (userId, isRead);
CREATE INDEX IF NOT EXISTS idx_event_items_event ON event_items (eventId);
CREATE INDEX IF NOT EXISTS idx_event_items_item ON event_items (itemId);
CREATE INDEX IF NOT EXISTS idx_outbox_state ON outbox (state, id);
`;

export const TABLE_COLUMNS: Record<string, string[]> = {
  branches: ['id', 'name', 'location', 'createdAt', 'updatedAt'],
  users: ['id', 'username', 'email', 'role', 'branchId', 'createdAt'],
  categories: ['id', 'name', 'createdAt'],
  items: [
    'id',
    'name',
    'category',
    'subCategory',
    'barcode',
    'sku',
    'price',
    'costPrice',
    'quantity',
    'unit',
    'reorderThreshold',
    'imageUrl',
    'branchId',
    'clientOpId',
    'createdAt',
    'updatedAt',
  ],
  events: [
    'id',
    'eventType',
    'financialType',
    'description',
    'amount',
    'date',
    'branchId',
    'toBranchId',
    'paymentMethod',
    'paymentReference',
    'paymentStatus',
    'isRecurring',
    'recurrenceRule',
    'clientOpId',
    'createdAt',
  ],
  event_items: ['id', 'eventId', 'itemId', 'quantity', 'unitPriceAtSale', 'createdAt'],
  schedules: ['id', 'activityId', 'scheduledDate', 'notificationMessage', 'createdAt'],
  performance: ['id', 'userId', 'activityId', 'status', 'createdAt', 'updatedAt'],
  notifications: [
    'id',
    'userId',
    'type',
    'title',
    'body',
    'isRead',
    'relatedEventId',
    'relatedItemId',
    'createdAt',
  ],
};
