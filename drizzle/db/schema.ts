import { integer, pgTable, serial, text, varchar, timestamp, date, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Branches Table (unchanged)
export const branchesTable = pgTable('branches', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdateFn(() => new Date()),
});

// Users Table (extended with push_token)
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  branchId: integer('branch_id').notNull().references(() => branchesTable.id),
  role: varchar('role', { length: 50 }).notNull().default('Staff'), // admin, Staff, Cashier
  image: varchar('image', { length: 255 }),
  pushToken: varchar('push_token', { length: 255 }), // nullable, for Expo push notifications
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdateFn(() => new Date()),
});

// Items Table (was resourcesTable)
export const itemsTable = pgTable('items', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull().default('physical-product'), // physical-product | service
  subCategory: varchar('sub_category', { length: 100 }), // Office Shoes, Casual Shoes, etc.
  barcode: varchar('barcode', { length: 255 }).unique(), // nullable, not all items have barcode
  sku: varchar('sku', { length: 100 }), // optional internal code
  price: integer('price').notNull().default(0), // sell price
  costPrice: integer('cost_price'), // optional, for margin reporting
  quantity: integer('quantity').notNull().default(0), // stock count
  unit: varchar('unit', { length: 50 }),
  reorderThreshold: integer('reorder_threshold'), // triggers low-stock notification
  imageUrl: text('image_url'), // for product card
  branchId: integer('branch_id').references(() => branchesTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdateFn(() => new Date()),
});

// Events Table (was activitiesTable)
export const eventsTable = pgTable('events', {
  id: serial('id').primaryKey(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // sale, transfer, receiving, adjustment
  financialType: varchar('financial_type', { length: 50 }).notNull(), // Revenue, Expense, Neutral
  description: varchar('description', { length: 255 }).notNull(),
  amount: integer('amount').notNull().default(0),
  date: date('date').notNull(),
  branchId: integer('branch_id').references(() => branchesTable.id),
  toBranchId: integer('to_branch_id').references(() => branchesTable.id), // nullable, for transfers
  paymentMethod: varchar('payment_method', { length: 50 }), // airtel_money, tnm_mpamba, cash
  paymentReference: varchar('payment_reference', { length: 255 }), // PayChangu tx_ref
  paymentStatus: varchar('payment_status', { length: 50 }), // pending, success, failed
  isRecurring: boolean('is_recurring').default(false),
  recurrenceRule: varchar('recurrence_rule', { length: 50 }), // daily, weekly
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Event Items Table (was activityResourcesTable)
export const eventItemsTable = pgTable('event_items', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .notNull()
    .references(() => eventsTable.id, { onDelete: 'cascade' }),
  itemId: integer('item_id')
    .notNull()
    .references(() => itemsTable.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  unitPriceAtSale: integer('unit_price_at_sale').notNull(), // snapshot of items.price at transaction time
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Schedules Table (unchanged)
export const schedulesTable = pgTable('schedules', {
  id: serial('id').primaryKey(),
  activityId: integer('activity_id')
    .notNull()
    .references(() => eventsTable.id, { onDelete: 'cascade' }),
  scheduledDate: date('scheduled_date').notNull(),
  notificationMessage: varchar('notification_message', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Performance Table (unchanged)
export const performanceTable = pgTable('performance', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  activityId: integer('activity_id')
    .notNull()
    .references(() => eventsTable.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('Assigned'), // Assigned, In Progress, Completed
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdateFn(() => new Date()),
});

// Notifications Table (NEW)
export const notificationsTable = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // low_stock, event_reminder, payment_status, assignment
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  isRead: boolean('is_read').default(false),
  relatedEventId: integer('related_event_id').references(() => eventsTable.id),
  relatedItemId: integer('related_item_id').references(() => itemsTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const branchesRelations = relations(branchesTable, ({ many }) => ({
  users: many(usersTable),
  items: many(itemsTable),
}));

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  branch: one(branchesTable, {
    fields: [usersTable.branchId],
    references: [branchesTable.id],
  }),
  performances: many(performanceTable),
  notifications: many(notificationsTable),
}));

export const itemsRelations = relations(itemsTable, ({ one, many }) => ({
  branch: one(branchesTable, {
    fields: [itemsTable.branchId],
    references: [branchesTable.id],
  }),
  eventItems: many(eventItemsTable),
}));

export const eventsRelations = relations(eventsTable, ({ one, many }) => ({
  branch: one(branchesTable, {
    fields: [eventsTable.branchId],
    references: [branchesTable.id],
  }),
  toBranch: one(branchesTable, {
    fields: [eventsTable.toBranchId],
    references: [branchesTable.id],
  }),
  eventItems: many(eventItemsTable),
  schedules: many(schedulesTable),
  performances: many(performanceTable),
}));

export const eventItemsRelations = relations(eventItemsTable, ({ one }) => ({
  event: one(eventsTable, {
    fields: [eventItemsTable.eventId],
    references: [eventsTable.id],
  }),
  item: one(itemsTable, {
    fields: [eventItemsTable.itemId],
    references: [itemsTable.id],
  }),
}));

export const schedulesRelations = relations(schedulesTable, ({ one }) => ({
  event: one(eventsTable, {
    fields: [schedulesTable.activityId],
    references: [eventsTable.id],
  }),
}));

export const performanceRelations = relations(performanceTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [performanceTable.userId],
    references: [usersTable.id],
  }),
  event: one(eventsTable, {
    fields: [performanceTable.activityId],
    references: [eventsTable.id],
  }),
}));

export const notificationsRelations = relations(notificationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [notificationsTable.userId],
    references: [usersTable.id],
  }),
  event: one(eventsTable, {
    fields: [notificationsTable.relatedEventId],
    references: [eventsTable.id],
  }),
  item: one(itemsTable, {
    fields: [notificationsTable.relatedItemId],
    references: [itemsTable.id],
  }),
}));
