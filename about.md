# Dashboard Diary — Farm Management App

**Purpose:** A farm management system ("Farm Diary") for agricultural operations in Malawi. It tracks revenues, expenses, activities, resources, schedules, staff performance, and multi-branch operations.

**Architecture:** Dual-frontend (Next.js web + Expo/React Native mobile) sharing one PostgreSQL database via Next.js API routes, using Drizzle ORM.

---

## Database Tables

| Table | Purpose |
|---|---|
| `branches` | Farm locations (name, location) |
| `users` | Staff accounts linked to branches. Roles: `admin` or `Staff` |
| `activities` | Farm activities with financial type (`Revenue`/`Expense`/`Neutral`), amount, date |
| `resources` | Inventory items (name, quantity, unit) |
| `activity_resources` | Links resources to activities with allocated quantities |
| `schedules` | Auto-created when an activity has a future date. Holds notification messages |
| `performance` | Assigns staff to activities with status (`Assigned`/`In Progress`/`Completed`) |

---

## Mobile Screens

| Screen | Access | What it does |
|---|---|---|
| **LandingScreen** | Public | Welcome screen with app description and user guide |
| **LoginScreen** | Public | Username/password login via `POST /api/users/login` (bcrypt). Session stored in AsyncStorage |
| **DashboardScreen** | Admin | Shows stat cards (branches, staff, resources counts), notifications, and recent activities |
| **BranchesScreen** | Admin | Lists all farm branches with name, location, and staff count |
| **AddBranchScreen** | Admin | Form to create a new branch |
| **UsersScreen** | Admin | Lists all user accounts with avatar, email, role badge |
| **AddUserScreen** | Admin | Form to create a new staff user (picks branch, enters name/email/password) |
| **ActivityScreen** | All | Form to log a new activity — pick description, type (Revenue/Expense/Neutral), amount, date. Future dates auto-create schedules |
| **ScheduleScreen** | All | Shows upcoming events grouped by month. Notification modal pops up for upcoming alerts |
| **ResourcesScreen** | All | Searchable inventory list showing resource name, type, quantity, unit |
| **StaffScreen** | Admin | Staff performance tracking — shows staff-to-activity assignments with status badges |
| **ReportScreen** | Admin | Detailed activity report with search/filter and share/export functionality |

---

## API Endpoints

| Endpoint | Purpose |
|---|---|
| `GET/POST /api/branches` | List/create branches |
| `PATCH/DELETE /api/branches` | Update/delete branches |
| `GET/POST /api/users` | List/create users (passwords hashed with bcrypt) |
| `POST /api/users/login` | Authenticate user |
| `GET/POST/PUT/DELETE /api/activities` | CRUD for activities. POST auto-creates schedules for future dates |
| `GET/POST/PUT/DELETE /api/resources` | CRUD for resources, optionally linked to activities |
| `GET /api/schedules` | List schedules as calendar events |
| `GET/POST /api/performance` | List/create staff performance records |
| `GET /api/dashboard` | Aggregated dashboard data — revenue/expense sums, net profit, detailed activity list with joined resources/staff/branches/schedules |

---

## Auth & Roles

- **Admin**: Full access — Dashboard, Branches, Users, Activities, Schedules, Resources, Staff Performance, Reports
- **Staff**: Limited — Activities, Schedules, Resources only
- No JWT/session tokens — login returns user object stored client-side in AsyncStorage

---

## Key Tech

- **Mobile**: Expo SDK 57, React Native 0.86.3, NativeWind (TailwindCSS), React Navigation (drawer + stack), Lucide icons
- **Backend**: Next.js 15 (App Router), Drizzle ORM, PostgreSQL, bcryptjs
- **Custom UI** component library at `src/components/ui/index.tsx` (Card, Button, Input, Badge, StatusBadge, ScreenHeader, EmptyState, ErrorState)
