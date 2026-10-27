# The Sneaker Lounge - Mobile App Features

## Overview
The mobile app is the operational interface for a shoe retail business. It supports store staff in daily sales, stock control, scheduling, reminders, branch coordination, team accountability, and sales reporting.

The app is implemented as an Expo + React Native solution with shared backend APIs, an offline sync layer (SQLite mirror with queued write-back), and local persistence for cart/transfer/auth state.

## How the app works in practice

This section explains the actual flow of the mobile app from a user’s perspective. It is meant to describe how the product behaves in real use, not just what screens exist.

### 1. Login and app entry
- The app opens on a landing screen that showcases the system's features with illustration images (bundled from `dashboard-mobile/assets/screenshots/`).
- A user logs in with their username and password.
- The login request goes through the backend authentication flow and the authenticated user is saved locally in AsyncStorage.
- After login, the app redirects to the shared dashboard and menu (every role sees the same menu entries).

### 2. Staff user flow
A staff user typically performs day-to-day retail operations.
- Logs in as a Staff account.
- Sees the same menu as admins (Dashboard, Items, Checkout, Branches, Schedule, Performance, Users, Settings); role differences are enforced at the data level, and the ability to add branches/users is admin-only.
- Opens the Items screen to search or review products.
- Can add or edit items with a product image and pick from the catalog's categories (or type a new one).
- Views the analytics dashboard scoped to their own work only — the app shows data generated about them (activities they are assigned to and sales they rang up), not the whole database.
- Uses the barcode scanner to find a product quickly.
- Adds items to the cart from the scanner or item list.
- Checks out the customer and selects a payment method.
- Completes the sale and sees the payment confirmation.
- Views schedule reminders and upcoming store activity.
- May use NFC check-in or staff accountability actions if the business requires it.

### 3. Admin user flow
An admin user has the extended operational and management access.
- Logs in as an Admin account.
- Sees the dashboard with revenue, sales, and summary metrics for the whole business.
- Reviews stock health, notifications, and recent sales activity.
- Opens branch and inventory screens to review stock levels across locations.
- Creates or updates products when needed, including a product image and dynamic categories.
- Manages stock transfers across branches.
- Reviews staff schedule activity and performance.
- Exports a full JSON backup of all server data or restores the server from a backup file (Settings → Offline Sync, admin-only).
- Manages users and branch-related configuration.
- Uses reports and analytics to review revenue and business performance.

### 4. Typical sales flow
A standard retail transaction usually follows this sequence:
1. Staff scans or searches for a product.
2. The item is added to the cart.
3. The staff adjusts quantities or removes products if needed.
4. The user selects the payment method.
5. The app submits the checkout request to the backend.
6. The sale event is recorded and stock is updated.
7. The sale is attributed to the logged-in user, so it appears in that staff member's scoped analytics.
8. The cart is cleared and the user can continue with the next customer.

### 5. Typical stock transfer flow
A multi-branch inventory process works like this:
1. Admin or staff selects a source branch.
2. The user chooses items to transfer from that branch.
3. The system keeps the selected transfer items in local transfer state.
4. The user finalizes the stock transfer workflow.
5. The backend creates a transfer event and updates stock levels in the relevant branch records.

### 6. Typical reporting and reminder flow
- The dashboard aggregates sales and financial totals for the data visible to the current user.
- Staff-scoped users only see analytics computed from activities they are assigned to; admins see the whole business.
- Searching a specific item or activity recalculates the revenue, expense, net profit cards and the chart to match the results being displayed.
- The app surfaces reminders, notifications, and scheduled activities.
- Admins can review performance and reporting data.
- The app can export or share reports for business review and follow-up.

## Core mobile features

### 1. Barcode POS item scanning
What it does:
- Opens the camera and scans product barcodes
- Looks up the item in the catalog
- Adds the item to the cart for a sale or opens the item details screen

How it is implemented:
- `dashboard-mobile/src/screens/ScannerScreen.tsx`
- `expo-camera` is used with barcode scanning enabled
- `api.get('/api/items?search=...')` performs the item fetch
- On successful scan, the app either navigates to the item details screen or adds the item to the cart

Implementation notes:
- Supports barcode types such as EAN-13, EAN-8, UPC-A, UPC-E, Code 128, and Code 39.
- If no item is found, the flow offers a path to create a new item with the scanned barcode prefilled.

### 2. Product checkout
What it does:
- Lets staff build a customer cart
- Updates quantities and total values in real time
- Creates a checkout flow for sale completion

How it is implemented:
- `dashboard-mobile/src/context/CartContext.tsx`
- `dashboard-mobile/src/screens/CheckoutScreen.tsx`
- Cart items persist in local state and are editable before payment

Implementation notes:
- The cart supports quantity changes, item removal, and item totals.
- The screen also loads recent sale history from `/api/events?event_type=sale`.
- A selected prior sale can be reloaded for edits or deletion.

### 3. Payment integration
What it does:
- Finalizes the sale with a chosen payment method
- Supports cash and mobile-money flows
- Sends the sale event to the backend for recording

How it is implemented:
- `dashboard-mobile/src/screens/PaymentScreen.tsx`
- `api.post('/api/checkout', ...)`
- `paymentMethod`: `cash`, `airtel_money`, or `tnm_mpamba`

Implementation notes:
- Cash flow confirms the transaction after staff accepts payment.
- Mobile-money flow requires a valid Malawi phone number and creates a reference string.
- The app then records the sale and clears the cart after a successful result.

### 4. Multi-branch stock transfer
What it does:
- Selects a source branch and inventory items to transfer
- Tracks quantities for each item while preparing a transfer
- Supports branch-to-branch movement and transfer-aware inventory review

How it is implemented:
- `dashboard-mobile/src/context/TransferContext.tsx`
- `dashboard-mobile/src/screens/BranchStockScreen.tsx`
- Transfer state is stored in AsyncStorage so the user can continue without losing the draft

Implementation notes:
- The app verifies the selected source branch before allowing transfer selection.
- Selected transfer items are persisted and can be cleared or replaced when switching branches.
- The screen also loads recent branch transfer events and current inventory.

### 5. Scheduling activities
What it does:
- Displays scheduled activities relevant to operations
- Gives managers and staff a calendar-like overview of upcoming tasks and events

How it is implemented:
- `dashboard-mobile/src/screens/ScheduleScreen.tsx`
- Local activity data is loaded from the shared backend and displayed in the mobile UI

Implementation notes:
- The screen is designed to surface future activities and reminders to staff.
- The scheduling flow supports operational planning tied to branch and activity events.

### 6. Push notifications / reminders
What it does:
- Sends in-app and OS-level reminders for important operational events
- Helps users react to low stock, task reminders, or time-sensitive activity

How it is implemented:
- `dashboard-mobile/src/services/notifications.ts`
- Local notification scheduling is handled through Expo-compatible notification modules

Implementation notes:
- This is implemented as local scheduling rather than remote server push registration.
- Expo Go compatibility is intentionally protected because remote push registration is not safe in the Expo Go environment.
- This is a good production reminder layer, but not yet a full external push-token system.

### 7. NFC performance tracking
What it does:
- Lets staff scan an NFC tag to register activity or check-in timing
- Tracks staff accountability and operational presence
- Assists with performance monitoring around workstations and task activity

How it is implemented:
- `dashboard-mobile/src/screens/StaffScreen.tsx`
- `dashboard-mobile/src/services/nfcService.ts`
- `dashboard-mobile/src/services/staffData.ts`

Implementation notes:
- The screen includes a “Scan NFC” action and maps the tag to a staff/workstation record.
- The NFC service is wrapped in a compatibility shim so the app still works in Expo Go without the native NFC module.
- In a real device / native build, the service can be restored to use the actual NFC hardware path.

### 8. Product images and dynamic categories in the item catalog
What it does:
- Lets staff and admins attach a product photo when creating or editing an item, so items render with real images on the Items screen
- Loads the category choices in the item form dynamically from the catalog instead of a hardcoded list
- Allows a brand-new category to be typed and used immediately if none of the existing categories fit

How it is implemented:
- `dashboard-mobile/src/screens/AddItemScreen.tsx`
- `expo-image-picker` (gallery or camera) + `expo-image-manipulator` (resize to 1024px width, JPEG at 0.7 quality)
- The processed photo is saved as a base64 data-URI in the item's `imageUrl` field, which the backend already persists (`items.image_url`); no extra database migration was needed
- Category options come from a persisted `categories` table via `GET /api/categories` (shared with the Items screen chips), falling back to distinct item `subCategory` values when the catalog is empty or unreachable
- The category field is an inline searchable dropdown — the same design as the Performance screen's Assign Activity input (search box + filtered option list + create row) — there is no modal; typing a name that doesn't exist offers a "Create … as new category" row that persists it with `POST /api/categories` (idempotent)

Implementation notes:
- The image picker offers "Choose from Gallery", "Take Photo" (permission-gated), and "Remove Image" when replacing an existing photo.
- Compression keeps each image payload roughly in the 100–300 KB range so saves stay quick.
- Items without an image still show the placeholder package icon on the Items screen cards.
- A category typed in the form is saved to the shared catalog immediately (the POST is idempotent — an existing name is returned as-is), so it is available for future items and to other users right away.
- The category the item being edited already uses is always included in the dropdown options.
- The category dropdown opens inline below the field (search input + scrollable options, keyboard stays up) instead of a centered modal, matching the Performance screen's activity picker.
- The database seed inserts the default shoe categories (Office, Casual, Sports, Designer) idempotently while preserving any categories created through the app.

### 9. Revenue analytics reports
What it does:
- Summarizes sales totals by activity type
- Shows revenue and expense metrics that always match the currently displayed (searched) activities
- Exports shareable reports for review and operations

How it is implemented:
- `dashboard-mobile/src/screens/DashboardScreen.tsx`
- `app/api/dashboard/route.ts` backend scoping
- Uses `react-native-chart-kit` to render bar charts
- Pulls dashboard data from `/api/dashboard?userId=<logged-in-user>`

Implementation notes:
- Revenue, Expense, and Net Profit cards and the bar chart are computed from the search-filtered activity list, not a separate global total. With no search term they express the totals of everything visible to the user; with a search term they express only the matched rows.
- The dashboard API looks up the requesting user's role in the database. Admin users receive all activity data; staff/cashier users receive only events in which they are assigned staff via the performance table, so their analytics reflect only data generated about them. The role is resolved server-side, so a modified client cannot self-elevate. Requests without a user id keep the original behavior (full data), and unknown user ids are treated as restricted rather than falling back to full data.
- Sales made through checkout are attributed to the logged-in user (a performance row is created with the sale event), so a staff member's own sales appear in their scoped dashboard.
- The dashboard includes a net profit calculation and an export/share button for filtered reports.
- This is the current mobile analytics view for day-to-day business monitoring.

### 10. Offline sync, JSON backup, and local persistence
What it does:
- Keeps the mobile app usable when the network is weak or unavailable: reads fall back to a local SQLite mirror and offline writes are queued and replayed when connectivity returns
- Shows live sync status (online/offline, pending/failed changes, last synced) with manual sync and retry controls
- Lets admins export a full JSON backup of server data and restore the server from a backup file (disaster recovery)
- Persists key user, cart, and transfer state locally across restarts

How it is implemented:
- Offline engine (self-contained, native platforms only): `dashboard-mobile/src/services/offline/` — SQLite schema/mirror (`schema.ts`, `repository.ts`), local mutations with temp ids (`localMutations.ts`), offline read resolution (`resolve.ts`), outbox replay (`sync.ts`), connectivity (`network.ts`); enabled by `expo-sqlite` + `@react-native-community/netinfo`
- Single integration seam: `dashboard-mobile/src/services/api.ts` — network-first requests; on network failure reads resolve from the SQLite mirror and queueable writes (items, categories, branches, checkout, events, activities, performance) are applied locally and enqueued with a `clientOpId`
- The Next.js API accepts `clientOpId` on POSTs and ignores duplicates, so replay never double-creates rows
- `dashboard-mobile/src/context/OfflineContext.tsx` (mounted in `App.tsx`) initializes the engine, auto-syncs on reconnect and after login, tracks status, and renders the status banner
- Settings screen (`SettingsScreen.tsx`): a **Sync Status** card for every role (connection, pending/failed counts, last synced, Sync now, Retry failed, refreshed on focus) and an **admin-only** **Offline Sync** card for JSON backup
- Backup helpers (`dashboard-mobile/src/services/backup.ts`): export calls `GET /api/backup/export?userId=…`, writes the JSON to the cache directory, and opens the system share sheet; import picks a file (`File.pickFileAsync`), validates it client-side, confirms with row counts, then calls `POST /api/backup/import?userId=…`
- Server backup endpoints (`app/api/backup/export|import/route.ts`) are admin-gated by database role lookup; import replaces all data in one transaction and realigns id sequences
- After a successful import the app clears its local mirror and outbox and pulls fresh, so stale queued changes can never replay onto the restored database

Implementation notes:
- The model is offline-first in experience but server-authoritative in data: reads prefer the server when reachable and the local database is a mirror plus staging area, not the source of truth.
- Platform degradation: on web the offline engine and backup card are hidden (SQLite and the native file picker are unavailable); the app works exactly like the non-offline build there.
- First login requires connectivity: the session is restored from AsyncStorage afterwards, so the app can then open offline.
- This engine has been verified end-to-end at the API level (backup export→import round-trip, 403s for non-admins, validation rejects, `clientOpId` dedup); real airplane-mode testing on a physical device remains a manual QA step.

### 11. Role-based authentication and access control
What it does:
- Logs users in with username/password
- Stores session state locally
- Restricts navigation and screens according to role (admin or staff)
- Lets admins create branches and users from the app, including choosing the new user's role (Staff, Cashier, or Admin)

How it is implemented:
- `dashboard-mobile/src/context/AuthContext.tsx`
- `dashboard-mobile/src/navigation/AppNavigator.tsx`
- `dashboard-mobile/src/screens/AddBranchScreen.tsx` → `POST /api/branches`
- `dashboard-mobile/src/screens/AddUserScreen.tsx` → `POST /api/users` (role chips: Staff / Cashier / Admin)

Implementation notes:
- Every role shares the same navigation menu: Dashboard, Items, Checkout, Branches, Schedule, Performance, Users, and Settings. The drawer is composed from a single shared list in `AppNavigator.tsx`.
- The only difference between roles is in the add screens: the AddBranch and AddUser stack screens are registered for admins only, and the Branches and Users screens hide their "add" buttons for non-admin users.
- The Dashboard entry is available to every role so users can see their own scoped analytics (staff/cashier see only data generated about them, never the whole database).
- Checkout is available to every role so the POS flow (item tap → cart → payment) works for everyone, and each sale is attributed to the person who rang it up.
- Branches and Users are viewable by every role; only admins can create branches or users.
- The Users screen is data-scoped as well as menu-scoped: the mobile app requests `/api/users?userId=…` and the API resolves the role server-side — admins get the full user list, staff/cashier get only their own row (unknown ids get nothing). The API also never returns password hashes.
- The Performance (Staff Accountability) screen is scoped the same way: staff/cashier users only see their own employee card and activity timeline; admins see all staff cards. A staff user's own card is auto-created if they have no employee record yet.
- The role selected when creating a user is validated server-side against the allowed roles (admin, Staff, Cashier) and defaults to Staff; it drives what data the user's dashboard will show.
- The users list already displays each user's role.

## Mobile feature summary by role

| Role | Typical access |
|------|----------------|
| Admin | Same menu as all roles, plus the ability to add branches and users (the add buttons and add screens are admin-only); sees all users and all staff performance cards; exports/imports JSON server backups from Settings |
| Cashier | Full menu (Dashboard, Items, Checkout, Branches, Schedule, Performance, Users, Settings); dashboard, users list, and performance screen all show only their own data; cannot add branches/users |
| Staff | Full menu (Dashboard, Items, Checkout, Branches, Schedule, Performance, Users, Settings); dashboard, users list, and performance screen all show only their own data (assigned activities only); cannot add branches/users |

## Known product limitations
- The app is mobile-first and does not yet provide a full production-grade remote push notification system.
- NFC remains Expo Go-safe but not fully native-hardware-ready in this environment.
- The offline engine syncs queued changes automatically on reconnect; on-device (airplane-mode) QA is still manual, and the web build intentionally runs without the offline layer.
- Reporting is currently operational and dashboard-based, not a full enterprise BI layer.

## Recommended current product definition
The mobile app should be described as a retail operations app with the following central capabilities:

1. Barcode-based POS item scanning
2. Product checkout flow
3. Payment integration
4. Multi-branch stock transfer
5. Scheduling and activity tracking
6. Reminders and notifications
7. NFC staff performance tracking
8. Product images and dynamic categories in the item catalog
9. Revenue analytics and reporting (user-scoped and search-reactive)
10. Offline sync with queued write-back, sync status controls, and admin JSON server backup/restore
11. Role-based authentication and access control

This is the current, accurate feature set for the app as implemented in the repo and should be used as the baseline for planning and future development.
