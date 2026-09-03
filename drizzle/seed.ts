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
  await db.delete(schema.performanceTable);
  await db.delete(schema.schedulesTable);
  await db.delete(schema.activityResourcesTable);
  await db.delete(schema.activitiesTable);
  await db.delete(schema.resourcesTable);
  await db.delete(schema.usersTable);
  await db.delete(schema.branchesTable);

  console.log('🏢 Inserting Branches...');
  const insertedBranches = await db
    .insert(schema.branchesTable)
    .values([
      { name: 'North Valley Farm', location: 'Lilongwe Rural' },
      { name: 'Green Acres Estate', location: 'Blantyre West' },
      { name: 'Highland Orchards', location: 'Mzuzu Hills' },
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
        email: 'admin@farmdiary.com',
        passwordHash: adminPasswordHash,
        branchId: insertedBranches[0].id,
        role: 'admin',
      },
      {
        username: 'chimwemwe_banda',
        email: 'chimwemwe@farmdiary.com',
        passwordHash: staffPasswordHash,
        branchId: insertedBranches[0].id,
        role: 'Staff',
      },
      {
        username: 'kondwani_phiri',
        email: 'kondwani@farmdiary.com',
        passwordHash: staffPasswordHash,
        branchId: insertedBranches[1].id,
        role: 'Staff',
      },
      {
        username: 'talandira_tembo',
        email: 'talandira@farmdiary.com',
        passwordHash: staffPasswordHash,
        branchId: insertedBranches[2].id,
        role: 'Staff',
      },
    ])
    .returning();

  console.log(`✅ Inserted ${insertedUsers.length} users.`);

  console.log('📦 Inserting Resources...');
  const insertedResources = await db
    .insert(schema.resourcesTable)
    .values([
      { name: 'John Deere 5050D Tractor', quantity: 3, unit: 'units' },
      { name: 'NPK 23:21:0+4S Fertilizer', quantity: 150, unit: 'bags' },
      { name: 'Hybrid Maize Seeds (PAN 53)', quantity: 60, unit: 'packs' },
      { name: 'Drip Irrigation Piping', quantity: 800, unit: 'meters' },
      { name: 'Solar Water Pump System', quantity: 2, unit: 'systems' },
      { name: 'Field Operations Crew', quantity: 18, unit: 'workers' },
    ])
    .returning();

  console.log(`✅ Inserted ${insertedResources.length} resources.`);

  console.log('🌾 Inserting Activities...');
  const insertedActivities = await db
    .insert(schema.activitiesTable)
    .values([
      {
        description: 'Maize Harvest & Bulk Grain Sale',
        activityType: 'Revenue',
        amount: 850000,
        activityDate: '2026-08-15',
      },
      {
        description: 'Dairy Milk Wholesale Distribution',
        activityType: 'Revenue',
        amount: 420000,
        activityDate: '2026-08-20',
      },
      {
        description: 'Fresh Tomato & Cabbage Market Supply',
        activityType: 'Revenue',
        amount: 195000,
        activityDate: '2026-08-28',
      },
      {
        description: 'Bulk Fertilizer & Seed Procurement',
        activityType: 'Expense',
        amount: 310000,
        activityDate: '2026-08-10',
      },
      {
        description: 'Tractor Engine Overhaul & Diesel Fuel',
        activityType: 'Expense',
        amount: 145000,
        activityDate: '2026-08-18',
      },
      {
        description: 'Drip Irrigation System Expansion',
        activityType: 'Expense',
        amount: 95000,
        activityDate: '2026-08-25',
      },
      {
        description: 'Field Soil pH Analysis & Crop Rotation Planning',
        activityType: 'Neutral',
        amount: 0,
        activityDate: '2026-08-05',
      },
      {
        description: 'Upcoming Soya Bean Planting Season',
        activityType: 'Expense',
        amount: 180000,
        activityDate: '2026-09-15',
      },
      {
        description: 'Upcoming Broiler Poultry Batch Delivery',
        activityType: 'Revenue',
        amount: 620000,
        activityDate: '2026-09-22',
      },
    ])
    .returning();

  console.log(`✅ Inserted ${insertedActivities.length} activities.`);

  console.log('🔗 Allocating Resources to Activities...');
  await db.insert(schema.activityResourcesTable).values([
    {
      activityId: insertedActivities[0].id, // Maize Harvest
      resourceId: insertedResources[0].id, // Tractor
      allocatedQuantity: 2,
    },
    {
      activityId: insertedActivities[0].id, // Maize Harvest
      resourceId: insertedResources[5].id, // Field Crew
      allocatedQuantity: 12,
    },
    {
      activityId: insertedActivities[3].id, // Fertilizer procurement
      resourceId: insertedResources[1].id, // Fertilizer
      allocatedQuantity: 50,
    },
    {
      activityId: insertedActivities[3].id, // Seed procurement
      resourceId: insertedResources[2].id, // Seed
      allocatedQuantity: 30,
    },
    {
      activityId: insertedActivities[5].id, // Irrigation Expansion
      resourceId: insertedResources[3].id, // Piping
      allocatedQuantity: 400,
    },
  ]);

  console.log('📅 Inserting Schedules...');
  await db.insert(schema.schedulesTable).values([
    {
      activityId: insertedActivities[7].id, // Soya bean planting
      scheduledDate: '2026-09-15',
      notificationMessage: 'Upcoming activity: Soya Bean Planting Season on 2026-09-15',
    },
    {
      activityId: insertedActivities[8].id, // Broiler Poultry
      scheduledDate: '2026-09-22',
      notificationMessage: 'Upcoming activity: Broiler Poultry Batch Delivery on 2026-09-22',
    },
    {
      activityId: insertedActivities[4].id, // Tractor Maintenance
      scheduledDate: '2026-09-30',
      notificationMessage: 'Upcoming activity: Quarterly Farm Machinery Inspection on 2026-09-30',
    },
  ]);

  console.log('📊 Inserting Staff Performance Records...');
  await db.insert(schema.performanceTable).values([
    {
      userId: insertedUsers[1].id, // chimwemwe_banda
      activityId: insertedActivities[0].id, // Maize harvest
      status: 'Completed',
    },
    {
      userId: insertedUsers[2].id, // kondwani_phiri
      activityId: insertedActivities[1].id, // Dairy milk
      status: 'Completed',
    },
    {
      userId: insertedUsers[3].id, // talandira_tembo
      activityId: insertedActivities[5].id, // Irrigation
      status: 'In Progress',
    },
    {
      userId: insertedUsers[1].id, // chimwemwe_banda
      activityId: insertedActivities[7].id, // Soya planting
      status: 'Assigned',
    },
  ]);

  console.log('\n✨ Database seeding complete! ✨');
  console.log('--------------------------------------------------');
  console.log('🔑 Default Login Credentials:');
  console.log('   Admin: username = admin          | password = admin123');
  console.log('   Staff: username = chimwemwe_banda | password = staff123');
  console.log('   Staff: username = kondwani_phiri  | password = staff123');
  console.log('   Staff: username = talandira_tembo | password = staff123');
  console.log('--------------------------------------------------\n');

  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
