// pg is loaded at runtime by the seed script.
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import * as schema from './db/schema';

// Load environment variables
config({ path: '.env.development.local' });
config({ path: '.env.local' });
config({ path: '.env' });

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgresql://postgres:postgres@localhost:5432/dashboard_diary';

async function seed() {
  console.log('🌱 Connecting to PostgreSQL database...');
  const pool = new Pool({
    connectionString,
    ssl:
      connectionString.includes('sslmode=require') ||
      connectionString.includes('neon.tech') ||
      connectionString.includes('supabase.co')
        ? { rejectUnauthorized: false }
        : undefined,
  });

  const db = drizzle(pool, { schema });

  console.log('🧹 Cleaning existing data...');
  // Truncate tables in cascade order
  await db.delete(schema.notificationsTable);
  await db.delete(schema.performanceTable);
  await db.delete(schema.schedulesTable);
  await db.delete(schema.eventItemsTable);
  await db.delete(schema.eventsTable);
  await db.delete(schema.itemsTable);
  await db.delete(schema.usersTable);
  await db.delete(schema.branchesTable);

  console.log('🏢 Inserting Branches...');
  const insertedBranches = await db
    .insert(schema.branchesTable)
    .values([
      { name: 'The Sneaker Lounge - Main Store', location: 'City Centre' },
      { name: 'The Sneaker Lounge - Mall Branch', location: 'Game City Mall' },
      { name: 'The Sneaker Lounge - Warehouse', location: 'Industrial Area' },
    ])
    .returning();

  console.log(`✅ Inserted ${insertedBranches.length} branches.`);

  console.log('👥 Inserting Users...');
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const staffPasswordHash = await bcrypt.hash('staff123', 10);

  const insertedUsers = await db
    .insert(schema.usersTable)
    .values([
      {
        username: 'admin',
        email: 'admin@sneakerlounge.com',
        passwordHash: adminPasswordHash,
        branchId: insertedBranches[0].id,
        role: 'admin',
      },
      {
        username: 'grace_mwangi',
        email: 'grace@sneakerlounge.com',
        passwordHash: staffPasswordHash,
        branchId: insertedBranches[0].id,
        role: 'Cashier',
      },
      {
        username: 'peter_banda',
        email: 'peter@sneakerlounge.com',
        passwordHash: staffPasswordHash,
        branchId: insertedBranches[0].id,
        role: 'Staff',
      },
      {
        username: 'mary_phiri',
        email: 'mary@sneakerlounge.com',
        passwordHash: staffPasswordHash,
        branchId: insertedBranches[1].id,
        role: 'Cashier',
      },
    ])
    .returning();

  console.log(`✅ Inserted ${insertedUsers.length} users.`);

  console.log('👟 Inserting Items (Shoe Products)...');
  const insertedItems = await db
    .insert(schema.itemsTable)
    .values([
      // Office Shoes
      { name: 'Classic Oxford Brogue', subCategory: 'Office Shoes', price: 45000, costPrice: 28000, quantity: 24, barcode: 'TSL-OF-001', branchId: insertedBranches[0].id },
      { name: 'Executive Derby Shoe', subCategory: 'Office Shoes', price: 38000, costPrice: 22000, quantity: 18, barcode: 'TSL-OF-002', branchId: insertedBranches[0].id },
      { name: 'Professional Loafer', subCategory: 'Office Shoes', price: 35000, costPrice: 20000, quantity: 30, barcode: 'TSL-OF-003', branchId: insertedBranches[0].id },
      // Casual Shoes
      { name: 'Urban Sneaker Classic', subCategory: 'Casual Shoes', price: 28000, costPrice: 15000, quantity: 45, barcode: 'TSL-CA-001', branchId: insertedBranches[0].id },
      { name: 'Canvas Slip-On', subCategory: 'Casual Shoes', price: 22000, costPrice: 12000, quantity: 60, barcode: 'TSL-CA-002', branchId: insertedBranches[0].id },
      { name: 'Leather Boat Shoe', subCategory: 'Casual Shoes', price: 32000, costPrice: 18000, quantity: 20, barcode: 'TSL-CA-003', branchId: insertedBranches[0].id },
      // Sports Shoes
      { name: 'Running Performance', subCategory: 'Sports Shoes', price: 55000, costPrice: 32000, quantity: 15, barcode: 'TSL-SP-001', branchId: insertedBranches[1].id },
      { name: 'Basketball High-Top', subCategory: 'Sports Shoes', price: 65000, costPrice: 38000, quantity: 12, barcode: 'TSL-SP-002', branchId: insertedBranches[1].id },
      { name: 'Training Cross-Fit', subCategory: 'Sports Shoes', price: 48000, costPrice: 28000, quantity: 22, barcode: 'TSL-SP-003', branchId: insertedBranches[1].id },
      // Designer Shoes
      { name: 'Italian Leather Oxford', subCategory: 'Designer Shoes', price: 120000, costPrice: 75000, quantity: 8, barcode: 'TSL-DE-001', branchId: insertedBranches[0].id },
      { name: 'Handcrafted Monk Strap', subCategory: 'Designer Shoes', price: 95000, costPrice: 58000, quantity: 10, barcode: 'TSL-DE-002', branchId: insertedBranches[0].id },
      { name: 'Premium Suede Chelsea', subCategory: 'Designer Shoes', price: 85000, costPrice: 52000, quantity: 6, barcode: 'TSL-DE-003', branchId: insertedBranches[1].id },
    ])
    .returning();

  console.log(`✅ Inserted ${insertedItems.length} items.`);

  console.log('🛒 Inserting Events (Sales)...');
  const insertedEvents = await db
    .insert(schema.eventsTable)
    .values([
      {
        eventType: 'sale',
        financialType: 'Revenue',
        description: 'Walk-in sale - 2 pairs Oxford Brogue',
        amount: 90000,
        date: '2026-08-28',
        branchId: insertedBranches[0].id,
        paymentMethod: 'cash',
        paymentStatus: 'success',
      },
      {
        eventType: 'sale',
        financialType: 'Revenue',
        description: 'Online order - Running Performance + Training Cross-Fit',
        amount: 103000,
        date: '2026-08-29',
        branchId: insertedBranches[1].id,
        paymentMethod: 'airtel_money',
        paymentStatus: 'success',
      },
      {
        eventType: 'sale',
        financialType: 'Revenue',
        description: 'Bulk order - 5 pairs Canvas Slip-On',
        amount: 110000,
        date: '2026-08-30',
        branchId: insertedBranches[0].id,
        paymentMethod: 'tnm_mpamba',
        paymentStatus: 'success',
      },
      {
        eventType: 'receiving',
        financialType: 'Neutral',
        description: 'Stock receipt - New Designer Shoes shipment',
        amount: 0,
        date: '2026-08-25',
        branchId: insertedBranches[2].id,
      },
      {
        eventType: 'transfer',
        financialType: 'Neutral',
        description: 'Stock transfer - Warehouse to Main Store',
        amount: 0,
        date: '2026-08-26',
        branchId: insertedBranches[2].id,
        toBranchId: insertedBranches[0].id,
      },
    ])
    .returning();

  console.log(`✅ Inserted ${insertedEvents.length} events.`);

  console.log('📦 Inserting Event Items...');
  await db.insert(schema.eventItemsTable).values([
    // Sale 1: 2 pairs Oxford Brogue
    { eventId: insertedEvents[0].id, itemId: insertedItems[0].id, quantity: 2, unitPriceAtSale: 45000 },
    // Sale 2: Running Performance + Training Cross-Fit
    { eventId: insertedEvents[1].id, itemId: insertedItems[6].id, quantity: 1, unitPriceAtSale: 55000 },
    { eventId: insertedEvents[1].id, itemId: insertedItems[8].id, quantity: 1, unitPriceAtSale: 48000 },
    // Sale 3: 5 pairs Canvas Slip-On
    { eventId: insertedEvents[2].id, itemId: insertedItems[4].id, quantity: 5, unitPriceAtSale: 22000 },
    // Receiving: Designer Shoes
    { eventId: insertedEvents[3].id, itemId: insertedItems[9].id, quantity: 4, unitPriceAtSale: 75000 },
    { eventId: insertedEvents[3].id, itemId: insertedItems[10].id, quantity: 3, unitPriceAtSale: 58000 },
    // Transfer: Casual Shoes from warehouse
    { eventId: insertedEvents[4].id, itemId: insertedItems[3].id, quantity: 10, unitPriceAtSale: 15000 },
    { eventId: insertedEvents[4].id, itemId: insertedItems[4].id, quantity: 15, unitPriceAtSale: 12000 },
  ]);

  console.log('📅 Inserting Schedules...');
  await db.insert(schema.schedulesTable).values([
    {
      activityId: insertedEvents[3].id, // Stock receiving
      scheduledDate: '2026-09-05',
      notificationMessage: 'Upcoming stock receiving: Designer Shoes shipment on 2026-09-05',
    },
    {
      activityId: insertedEvents[4].id, // Stock transfer
      scheduledDate: '2026-09-10',
      notificationMessage: 'Scheduled stock transfer: Warehouse to Main Store on 2026-09-10',
    },
  ]);

  console.log('📊 Inserting Staff Performance Records...');
  await db.insert(schema.performanceTable).values([
    {
      userId: insertedUsers[1].id, // grace_mwangi
      activityId: insertedEvents[0].id, // Sale 1
      status: 'Completed',
    },
    {
      userId: insertedUsers[2].id, // peter_banda
      activityId: insertedEvents[1].id, // Sale 2
      status: 'Completed',
    },
    {
      userId: insertedUsers[1].id, // grace_mwangi
      activityId: insertedEvents[2].id, // Sale 3
      status: 'Completed',
    },
    {
      userId: insertedUsers[2].id, // peter_banda
      activityId: insertedEvents[4].id, // Transfer
      status: 'In Progress',
    },
  ]);

  console.log('🔔 Inserting Notifications...');
  await db.insert(schema.notificationsTable).values([
    {
      userId: insertedUsers[0].id, // admin
      type: 'low_stock',
      title: 'Low Stock Alert',
      body: 'Italian Leather Oxford is running low (8 remaining)',
      relatedItemId: insertedItems[9].id,
    },
    {
      userId: insertedUsers[1].id, // grace_mwangi
      type: 'payment_status',
      title: 'Payment Received',
      body: 'Walk-in sale completed - MWK 90,000 via Cash',
      relatedEventId: insertedEvents[0].id,
    },
    {
      userId: insertedUsers[2].id, // peter_banda
      type: 'assignment',
      title: 'Stock Transfer Assigned',
      body: 'You have been assigned to complete stock transfer from Warehouse to Main Store',
      relatedEventId: insertedEvents[4].id,
    },
  ]);

  console.log('\n✨ Database seeding complete! ✨');
  console.log('--------------------------------------------------');
  console.log('🔑 Default Login Credentials:');
  console.log('   Admin:  username = admin            | password = admin123');
  console.log('   Cashier: username = grace_mwangi    | password = staff123');
  console.log('   Staff:  username = peter_banda      | password = staff123');
  console.log('   Cashier: username = mary_phiri      | password = staff123');
  console.log('--------------------------------------------------\n');

  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
