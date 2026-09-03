# Dashboard Diary (Next-Type)

Dashboard Diary is a farm management web application built with **Next.js**, **PostgreSQL**, and **Drizzle ORM**. It features a responsive Next.js frontend with an API backend for tracking revenues, expenses, activities, resources, schedules, and staff performance.

---

## Project Overview

- **Frontend / Backend:**
  - Developed using **Next.js** (App Router).
  - Handles API requests and serves the responsive web interface.
- **Database:**
  - **PostgreSQL** integrated using **Drizzle ORM** with connection pooling.
- **Package Manager:**
  - **pnpm** (or npm/yarn).

---

## Features

- **Farm Analytics Dashboard**: Metrics overview for total revenue, expenses, and net profit with interactive Recharts bar charts.
- **Activity Tracking**: Manage and record farm revenues, expenses, and neutral operational activities.
- **Resource Management**: Track machinery, fertilizers, seeds, irrigation equipment, and labor allocations.
- **Schedules & Calendar**: Calendar views with FullCalendar for scheduled farm tasks and upcoming notifications.
- **Staff & Branch Management**: Manage branches, assign staff members, and track performance statuses (Assigned, In Progress, Completed).
- **Reports & PDF Export**: Detailed data tables with TanStack Table and one-click PDF generation via jsPDF & autoTable.

---

## Getting Started

### Prerequisites

Make sure you have the following installed:
- **Node.js** (>= 18.x)
- **pnpm** (or npm)
- **PostgreSQL** (e.g., PostgreSQL 16 + pgAdmin 4 or cloud PostgreSQL like Supabase/Neon)

### 1. Configure Environment Variables

Create a `.env` or `.env.local` file in the root directory (see `.env.example`):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dashboard_diary"
```
*(Replace `postgres:postgres` with your PostgreSQL username and password if different).*

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Database & Push Schema

To create the tables in your PostgreSQL database:

```bash
pnpm db:push
```

### 4. Seed Sample Test Data

To populate your database with rich sample data (branches, users, activities, resources, schedules, and performance records):

```bash
pnpm db:seed
```

### 5. Run the Application

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Default Seeded Credentials

When seeded with `pnpm db:seed`, the following accounts are ready to use:

| Role | Username | Password | Email |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | `admin@farmdiary.com` |
| **Staff** | `chimwemwe_banda` | `staff123` | `chimwemwe@farmdiary.com` |
| **Staff** | `kondwani_phiri` | `staff123` | `kondwani@farmdiary.com` |
| **Staff** | `talandira_tembo` | `staff123` | `talandira@farmdiary.com` |

---

## Database Helper Scripts

- `pnpm db:push` - Synchronize and push Drizzle schema directly to PostgreSQL.
- `pnpm db:generate` - Generate new SQL migration files in `drizzle/migrations/`.
- `pnpm db:migrate` - Apply SQL migrations.
- `pnpm db:seed` - Seed the database with realistic sample test data.
- `pnpm db:studio` - Open Drizzle Studio visual database inspector in your browser.

---

## Directory Structure

```text
/
├── app/                  # Next.js App Router (Pages & API)
│   ├── api/              # API Endpoints (dashboard, activities, branches, users, etc.)
│   └── farm/             # Farm management pages (dashboard, report, activity, etc.)
├── components/           # Reusable UI & Shadcn components
├── drizzle/              # Database schema, connections, migrations, and seed script
│   ├── db/
│   │   ├── index.ts      # PostgreSQL connection pool & Drizzle instance
│   │   └── schema.ts     # PostgreSQL schema definitions & relations
│   └── seed.ts           # Test data generator
└── public/               # Static assets
```

---

## License

This project is licensed under the MIT License.
