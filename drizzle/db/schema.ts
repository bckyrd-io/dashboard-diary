import { integer, pgTable, serial, text, varchar, timestamp, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Branches Table
export const branchesTable = pgTable('branches', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdateFn(() => new Date()),
});

// Users Table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  branchId: integer('branch_id').notNull().references(() => branchesTable.id),
  role: varchar('role', { length: 50 }).notNull().default('Staff'),
  image: varchar('image', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdateFn(() => new Date()),
});

// Activities Table
export const activitiesTable = pgTable('activities', {
  id: serial('id').primaryKey(),
  description: varchar('description', { length: 255 }).notNull(),
  activityType: varchar('activity_type', { length: 255 }).notNull(), // Revenue, Expense, Neutral
  amount: integer('amount').notNull().default(0),
  activityDate: date('activity_date').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Resources Table
export const resourcesTable = pgTable('resources', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull().default(0),
  unit: varchar('unit', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdateFn(() => new Date()),
});

// Activity-Resources Link Table
export const activityResourcesTable = pgTable('activity_resources', {
  id: serial('id').primaryKey(),
  activityId: integer('activity_id')
    .notNull()
    .references(() => activitiesTable.id, { onDelete: 'cascade' }),
  resourceId: integer('resource_id')
    .notNull()
    .references(() => resourcesTable.id, { onDelete: 'cascade' }),
  allocatedQuantity: integer('allocated_quantity').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Schedules Table
export const schedulesTable = pgTable('schedules', {
  id: serial('id').primaryKey(),
  activityId: integer('activity_id')
    .notNull()
    .references(() => activitiesTable.id, { onDelete: 'cascade' }),
  scheduledDate: date('scheduled_date').notNull(),
  notificationMessage: varchar('notification_message', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Performance Table
export const performanceTable = pgTable('performance', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  activityId: integer('activity_id')
    .notNull()
    .references(() => activitiesTable.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('Assigned'), // Assigned, In Progress, Completed
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdateFn(() => new Date()),
});

// Relations
export const branchesRelations = relations(branchesTable, ({ many }) => ({
  users: many(usersTable),
}));

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  branch: one(branchesTable, {
    fields: [usersTable.branchId],
    references: [branchesTable.id],
  }),
  performances: many(performanceTable),
}));

export const activitiesRelations = relations(activitiesTable, ({ many }) => ({
  activityResources: many(activityResourcesTable),
  schedules: many(schedulesTable),
  performances: many(performanceTable),
}));

export const resourcesRelations = relations(resourcesTable, ({ many }) => ({
  activityResources: many(activityResourcesTable),
}));

export const activityResourcesRelations = relations(activityResourcesTable, ({ one }) => ({
  activity: one(activitiesTable, {
    fields: [activityResourcesTable.activityId],
    references: [activitiesTable.id],
  }),
  resource: one(resourcesTable, {
    fields: [activityResourcesTable.resourceId],
    references: [resourcesTable.id],
  }),
}));

export const schedulesRelations = relations(schedulesTable, ({ one }) => ({
  activity: one(activitiesTable, {
    fields: [schedulesTable.activityId],
    references: [activitiesTable.id],
  }),
}));

export const performanceRelations = relations(performanceTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [performanceTable.userId],
    references: [usersTable.id],
  }),
  activity: one(activitiesTable, {
    fields: [performanceTable.activityId],
    references: [activitiesTable.id],
  }),
}));
