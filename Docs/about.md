# The Sneaker Lounge — Micro-ERP System

**Purpose:** A shoe retail management system ("The Sneaker Lounge") for managing store operations in Malawi. It tracks sales, inventory, schedules, staff performance, and multi-branch operations. "Home of Shoes and Other Accessories."

**Architecture:** Dual-frontend (Next.js web + Expo/React Native mobile) sharing one PostgreSQL database via Next.js API routes, using Drizzle ORM.

---

## Database Tables

| Table | Purpose |
|---|---|
| `branches` | Store locations (name, location) |
| `users` | Staff accounts linked to branches. Roles: `admin`, `Staff`, or `Cashier` |
| `items` | Product catalog (name, category, subcategory, barcode, price, stock, image) |
| `events` | Transaction log (sales, transfers, receiving, adjustments) with financial type |
| `event_items` | Line items linking events to products with quantity and price at time of sale |
| `schedules` | Auto-created when an event has a future date. Holds notification messages |
| `performance` | Assigns staff to events with status (`Assigned`/`In Progress`/`Completed`) |
| `notifications` | System notifications for low stock, payment status, assignments |

---

## Mobile Screens

| Screen | Access | What it does |
|---|---|---|
| **LandingScreen** | Public | Welcome screen with app description and user guide |
| **LoginScreen** | Public | Username/password login via `POST /api/users/login` (bcrypt). Session stored in AsyncStorage |
| **DashboardScreen** | Admin | Shows stat cards (sales, items, low stock counts), notifications, and recent sales |
| **ItemsScreen** | All | Ecommerce-style product grid with cards, search, category filters |
| **ItemDetailScreen** | All | View/edit item details, stock levels, transaction history |
| **AddItemScreen** | Admin | Form to create a new product |
| **ScannerScreen** | All | Full-screen barcode scanner for item lookup or checkout |
| **CheckoutScreen** | All | Cart management, payment method selection, process sales |
| **EventsScreen** | All | Full event log (sales, transfers, receiving) with filters |
| **EventDetailScreen** | All | View event details and line items |
| **BranchesScreen** | Admin | Lists all store branches with name, location, and staff count |
| **AddBranchScreen** | Admin | Form to create a new branch |
| **UsersScreen** | Admin | Lists all user accounts with avatar, email, role badge |
| **AddUserScreen** | Admin | Form to create a new staff user (picks branch, enters name/email/password) |
| **ScheduleScreen** | All | Shows upcoming events grouped by month. Notification modal pops up for upcoming alerts |
| **StaffScreen** | Admin | Staff performance tracking — shows staff-to-event assignments with status badges |
| **ReportScreen** | Admin | Detailed sales report with search/filter and share/export functionality |
| **NotificationsScreen** | All | System notifications with mark-as-read and deep linking |

---

## API Endpoints

| Endpoint | Purpose |
|---|---|
| `GET/POST /api/branches` | List/create branches |
| `PATCH/DELETE /api/branches` | Update/delete branches |
| `GET/POST /api/users` | List/create users (passwords hashed with bcrypt) |
| `POST /api/users/login` | Authenticate user |
| `GET/POST/PUT/DELETE /api/items` | CRUD for products |
| `GET /api/items/scan/[barcode]` | Lookup item by barcode |
| `GET/POST/PUT/DELETE /api/events` | CRUD for events (sales, transfers, receiving) |
| `POST /api/checkout` | Process checkout (create sale event, deduct stock) |
| `POST /api/checkout/payment` | Initiate PayChangu payment |
| `POST /api/stock/transfer` | Create stock transfer event |
| `POST /api/stock/receiving` | Create stock receiving event |
| `GET /api/schedules` | List schedules as calendar events |
| `GET/POST /api/performance` | List/create staff performance records |
| `GET /api/dashboard` | Aggregated dashboard data — sales totals, inventory stats, recent transactions |
| `GET/POST /api/notifications` | List/create notifications |
| `POST /api/notifications/[id]/read` | Mark notification as read |

---

## Auth & Roles

- **Admin**: Full access — Dashboard, Items, Branches, Users, Events, Schedules, Performance, Reports
- **Staff**: Limited — Items, Events, Schedules, Checkout
- **Cashier**: Limited — Items, Checkout, Events, Schedules
- No JWT/session tokens (MVP) — login returns user object stored client-side in AsyncStorage

---

## Key Tech

- **Mobile**: Expo SDK 57, React Native 0.86.3, NativeWind (TailwindCSS), React Navigation (drawer + stack), Lucide icons
- **Backend**: Next.js 15 (App Router), Drizzle ORM, PostgreSQL, bcryptjs
- **Custom UI** component library at `src/components/ui/index.tsx` (Card, Button, Input, Badge, StatusBadge, ScreenHeader, EmptyState, ErrorState)
