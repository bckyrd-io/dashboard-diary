# The Sneaker Lounge — MVP Implementation Plan

## Overview

Transform the existing "Farm Diary" app into "The Sneaker Lounge" micro-ERP for shoe retail. This is a rename + extension, not a rewrite.

**Existing Stack:**
- Mobile: Expo SDK 57, React Native 0.86.3, NativeWind, React Navigation
- Backend: Next.js 15 (App Router), Drizzle ORM, PostgreSQL
- Web: Next.js frontend sharing the same Postgres database

**Target Brand:**
- Store name: The Sneaker Lounge
- Primary color: Blue (#1D4ED8)
- Tone: Clean, retail/ecommerce-style

---

## Phase 1: Schema Rename + Extension

### 1.1 Rename Tables

| Old Table | New Table | Notes |
|-----------|-----------|-------|
| `resources` | `items` | Catalog of sellable items |
| `activities` | `events` | Transaction/event log |
| `activity_resources` | `event_items` | Line items linking events to items |

**Keep unchanged:** `branches`, `users`, `schedules`, `performance`

### 1.2 New Table: `notifications`

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- low_stock, event_reminder, payment_status, assignment
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_event_id INTEGER REFERENCES events(id),
  related_item_id INTEGER REFERENCES items(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 1.3 Extend `items` Table (was `resources`)

Add new columns:
- `category` VARCHAR(50) -- 'physical-product' | 'service'
- `sub_category` VARCHAR(100) -- 'Office Shoes', 'Casual Shoes', etc.
- `barcode` VARCHAR(255) UNIQUE -- nullable
- `sku` VARCHAR(100) -- optional internal code
- `price` INTEGER -- sell price in smallest currency unit
- `cost_price` INTEGER -- optional, for margin reporting
- `reorder_threshold` INTEGER -- triggers low-stock notification
- `image_url` TEXT -- for product card
- `branch_id` INTEGER REFERENCES branches(id)

### 1.4 Extend `events` Table (was `activities`)

Add new columns:
- `event_type` VARCHAR(50) -- 'sale' | 'transfer' | 'receiving' | 'adjustment'
- `to_branch_id` INTEGER -- nullable, for transfer events
- `payment_method` VARCHAR(50) -- 'airtel_money' | 'tnm_mpamba' | 'cash'
- `payment_reference` VARCHAR(255) -- PayChangu tx_ref
- `payment_status` VARCHAR(50) -- 'pending' | 'success' | 'failed'
- `is_recurring` BOOLEAN DEFAULT FALSE
- `recurrence_rule` VARCHAR(50) -- 'daily' | 'weekly'

Rename columns:
- `activity_type` -> `financial_type` (Revenue/Expense/Neutral)
- `activity_date` -> `date`

### 1.5 Extend `event_items` Table (was `activity_resources`)

Add new column:
- `unit_price_at_sale` INTEGER -- snapshot of items.price at transaction time

Rename columns:
- `activity_id` -> `event_id`
- `resource_id` -> `item_id`
- `allocated_quantity` -> `quantity`

### 1.6 Extend `users` Table

Add new column:
- `push_token` VARCHAR(255) -- nullable, for Expo push notifications

Expand role options:
- Keep: `admin`, `Staff`
- Add: `Cashier`

---

## Phase 2: Brand Color Migration

### 2.1 Update CSS Variables

**File: `app/globals.css`**
```css
:root {
  /* Change from green to blue */
  --primary: 224 76% 48%; /* #1D4ED8 */
  --primary-foreground: 0 0% 98%;
}
```

### 2.2 Update Mobile Theme

**File: `dashboard-mobile/src/constants/Theme.ts`**
```typescript
export const Theme = {
  primary: '#1D4ED8',        // was #33b76d
  primaryDark: '#1E40AF',    // was #2a9d5c
  primaryLight: '#EFF6FF',   // was #e8f8f0
  // ... rest stays the same
};
```

### 2.3 Update Sidebar Header

**File: `components/app-sidebar.tsx`**
- Change "Ground" -> "The Sneaker Lounge"
- Change "Farm Dashboard" -> "Home of Shoes and Other Accessories"

**File: `dashboard-mobile/src/navigation/AppNavigator.tsx`**
- Change drawer header title/subtitle

---

## Phase 3: Navigation Restructuring

### 3.1 New Drawer Items (Mobile)

```
OVERVIEW
  Home (LayoutDashboard)

CATALOG
  Items (Tag) -- product grid
  Branches (Building)

OPERATIONS
  Checkout (CreditCard) -- cart + payment
  Events (Receipt) -- event log
  Schedule (CalendarDays)
  Notifications (Bell)

PEOPLE
  Users (Users)
  Performance (BarChart3)

INSIGHTS
  Reports (BarChart3)
```

### 3.2 New Sidebar Items (Web)

Same structure as mobile, with URLs:
- `/store/items` (was `/farm/resource`)
- `/store/branches` (was `/farm/branch`)
- `/store/checkout` (NEW)
- `/store/events` (was `/farm/activity`)
- `/store/schedule` (was `/farm/schedule`)
- `/store/notifications` (NEW)
- `/store/users` (was `/farm/user`)
- `/store/performance` (was `/farm/staff`)
- `/store/reports` (was `/farm/report`)

### 3.3 New Screens Required

| Screen | Purpose |
|--------|---------|
| `ItemsScreen` | Ecommerce-style product grid with cards, search, category filters |
| `ItemDetailScreen` | View/edit item details |
| `AddItemScreen` | Create new item form |
| `ScannerScreen` | Full-screen camera for barcode scanning |
| `CheckoutScreen` | Cart + payment method selection |
| `PastCheckoutsScreen` | History of completed sales |
| `EventsScreen` | Full event log (sales, transfers, receiving) |
| `EventDetailScreen` | View event details + line items |
| `NotificationsScreen` | List of notifications with mark-as-read |
| `StockTransferScreen` | Create stock transfer event |
| `StockReceivingScreen` | Create stock receiving event |

---

## Phase 4: API Routes

### 4.1 Items API

**`/api/items/route.ts`**
- `GET` - Fetch all items (with optional filters: category, sub_category, branch_id, search)
- `POST` - Create new item
- `PUT` - Update item
- `DELETE` - Delete item

**`/api/items/[id]/route.ts`**
- `GET` - Fetch single item with event history
- `PATCH` - Update item
- `DELETE` - Delete item

**`/api/items/scan/[barcode]/route.ts`**
- `GET` - Lookup item by barcode (for scanner)

### 4.2 Events API

**`/api/events/route.ts`**
- `GET` - Fetch all events (with filters: event_type, date range, branch_id)
- `POST` - Create new event (sale, transfer, receiving)

**`/api/events/[id]/route.ts`**
- `GET` - Fetch single event with line items
- `PATCH` - Update event (e.g., payment_status)

### 4.3 Checkout API

**`/api/checkout/route.ts`**
- `POST` - Process checkout:
  1. Validate cart items
  2. Create event with event_type='sale'
  3. Create event_items with unit_price_at_sale
  4. Deduct items.quantity
  5. Return event ID

**`/api/checkout/payment/route.ts`**
- `POST` - Initiate PayChangu payment
- `GET` - Check payment status

### 4.4 Stock Transfer API

**`/api/stock/transfer/route.ts`**
- `POST` - Create transfer event:
  1. Validate source/destination branches
  2. Deduct stock from source
  3. Add stock to destination
  4. Create event with event_type='transfer'

### 4.5 Stock Receiving API

**`/api/stock/receiving/route.ts`**
- `POST` - Create receiving event:
  1. Add stock to branch
  2. Create event with event_type='receiving'

### 4.6 Notifications API

**`/api/notifications/route.ts`**
- `GET` - Fetch notifications for user
- `POST` - Create notification (internal use)

**`/api/notifications/[id]/read/route.ts`**
- `POST` - Mark notification as read

### 4.7 Push Notifications

**`/api/push/register/route.ts`**
- `POST` - Register Expo push token

**`/api/push/send/route.ts`**
- `POST` - Send push notification (triggered by events)

---

## Phase 5: Seed Data

### 5.1 Branches

```typescript
[
  { name: 'The Sneaker Lounge - Main Store', location: 'City Centre' },
  { name: 'The Sneaker Lounge - Mall Branch', location: 'Game City Mall' },
  { name: 'The Sneaker Lounge - Warehouse', location: 'Industrial Area' },
]
```

### 5.2 Users

```typescript
[
  { username: 'admin', email: 'admin@sneakerlounge.com', role: 'admin', branchId: 1 },
  { username: 'grace_mwangi', email: 'grace@sneakerlounge.com', role: 'Cashier', branchId: 1 },
  { username: 'peter_banda', email: 'peter@sneakerlounge.com', role: 'Staff', branchId: 1 },
  { username: 'mary_phiri', email: 'mary@sneakerlounge.com', role: 'Cashier', branchId: 2 },
]
```

### 5.3 Items (Shoe Products)

```typescript
[
  // Office Shoes
  { name: 'Classic Oxford Brogue', subCategory: 'Office Shoes', price: 45000, costPrice: 28000, quantity: 24, barcode: 'TSL-OF-001' },
  { name: 'Executive Derby Shoe', subCategory: 'Office Shoes', price: 38000, costPrice: 22000, quantity: 18, barcode: 'TSL-OF-002' },
  { name: 'Professional Loafer', subCategory: 'Office Shoes', price: 35000, costPrice: 20000, quantity: 30, barcode: 'TSL-OF-003' },
  
  // Casual Shoes
  { name: 'Urban Sneaker Classic', subCategory: 'Casual Shoes', price: 28000, costPrice: 15000, quantity: 45, barcode: 'TSL-CA-001' },
  { name: 'Canvas Slip-On', subCategory: 'Casual Shoes', price: 22000, costPrice: 12000, quantity: 60, barcode: 'TSL-CA-002' },
  { name: 'Leather Boat Shoe', subCategory: 'Casual Shoes', price: 32000, costPrice: 18000, quantity: 20, barcode: 'TSL-CA-003' },
  
  // Sports Shoes
  { name: 'Running Performance', subCategory: 'Sports Shoes', price: 55000, costPrice: 32000, quantity: 15, barcode: 'TSL-SP-001' },
  { name: 'Basketball High-Top', subCategory: 'Sports Shoes', price: 65000, costPrice: 38000, quantity: 12, barcode: 'TSL-SP-002' },
  { name: 'Training Cross-Fit', subCategory: 'Sports Shoes', price: 48000, costPrice: 28000, quantity: 22, barcode: 'TSL-SP-003' },
  
  // Designer Shoes
  { name: 'Italian Leather Oxford', subCategory: 'Designer Shoes', price: 120000, costPrice: 75000, quantity: 8, barcode: 'TSL-DE-001' },
  { name: 'Handcrafted Monk Strap', subCategory: 'Designer Shoes', price: 95000, costPrice: 58000, quantity: 10, barcode: 'TSL-DE-002' },
  { name: 'Premium Suede Chelsea', subCategory: 'Designer Shoes', price: 85000, costPrice: 52000, quantity: 6, barcode: 'TSL-DE-003' },
]
```

---

## Phase 6: Auth Hardening

### 6.1 JWT Implementation

**Install:** `jsonwebtoken` + `@types/jsonwebtoken`

**File: `lib/auth.ts`**
```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sneaker-lounge-secret-key';

export function generateToken(user: { id: number; username: string; role: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
```

### 6.2 Update Login Endpoint

**File: `app/api/users/login/route.ts`**
- Generate JWT token on successful login
- Return token in response

### 6.3 Add Auth Middleware

**File: `lib/middleware.ts`**
```typescript
export function withAuth(handler: Function) {
  return async (req: Request) => {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const user = verifyToken(token);
    return handler(req, user);
  };
}
```

### 6.4 Update Mobile Auth Context

**File: `dashboard-mobile/src/context/AuthContext.tsx`**
- Store JWT token in AsyncStorage
- Send token in API requests
- Handle token expiration

---

## Phase 7: Scanner Integration

### 7.1 Install Dependencies

```bash
expo install expo-camera
expo install expo-barcode-scanner
```

### 7.2 Scanner Screen

**File: `dashboard-mobile/src/screens/ScannerScreen.tsx`**
- Full-screen camera view
- Accept `mode` param: 'lookup' | 'checkout'
- On barcode scan:
  - Call `/api/items/scan/[barcode]`
  - If found:
    - mode='lookup': navigate to ItemDetailScreen
    - mode='checkout': add to cart, navigate back to CheckoutScreen
  - If not found:
    - Navigate to AddItemScreen with barcode pre-filled

### 7.3 Camera Permissions

Handle camera permissions in ScannerScreen:
```typescript
const [hasPermission, setHasPermission] = useState<boolean | null>(null);

useEffect(() => {
  (async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  })();
}, []);
```

---

## Phase 8: Checkout & Payment

### 8.1 Cart State Management

**File: `dashboard-mobile/src/context/CartContext.tsx`**
```typescript
interface CartItem {
  itemId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
}
```

Persist cart to AsyncStorage to survive app restarts.

### 8.2 Checkout Screen

**File: `dashboard-mobile/src/screens/CheckoutScreen.tsx`**
- Display cart items with editable quantity
- Show running total
- Payment method selection (Airtel Money, TNM Mpamba, Cash)
- "Pay Now" button

### 8.3 PayChangu Integration

**Server-side only** (Next.js API routes):

**File: `app/api/checkout/payment/route.ts`**
```typescript
// 1. Initiate charge
const response = await fetch('https://paychangw.com/api/v1/charge', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PAYCHANGU_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: totalAmount,
    currency: 'MWK',
    phone_number: phoneNumber,
    provider: paymentMethod, // 'airtel_money' | 'tnm_mpamba'
    external_id: eventId,
  }),
});

// 2. Store payment_reference in event
// 3. Poll or wait for webhook
// 4. On success: update payment_status = 'success'
// 5. On failure: update payment_status = 'failed'
```

### 8.4 Webhook Endpoint

**File: `app/api/checkout/webhook/route.ts`**
- Receive PayChangu webhook
- Update event payment_status
- Send push notification to user

---

## Phase 9: Notifications

### 9.1 Low Stock Detection

**File: `lib/notifications.ts`**
```typescript
export async function checkLowStock() {
  const lowStockItems = await db
    .select()
    .from(itemsTable)
    .where(lte(itemsTable.quantity, itemsTable.reorderThreshold));
  
  for (const item of lowStockItems) {
    await createNotification({
      userId: item.branchId, // notify branch manager
      type: 'low_stock',
      title: 'Low Stock Alert',
      body: `${item.name} is running low (${item.quantity} remaining)`,
      relatedItemId: item.id,
    });
  }
}
```

### 9.2 Push Notification Service

**File: `lib/push.ts`**
```typescript
import * as ExpoServer from 'expo-server-sdk';

const expo = new ExpoServer.Expo();

export async function sendPushNotification(pushToken: string, title: string, body: string) {
  if (!ExpoServer.Expo.isExpoPushToken(pushToken)) return;
  
  await expo.sendPushNotificationsAsync([{
    to: pushToken,
    title,
    body,
  }]);
}
```

### 9.3 Notifications Screen

**File: `dashboard-mobile/src/screens/NotificationsScreen.tsx`**
- FlatList of notifications
- Pull-to-refresh
- Mark as read on tap
- Deep link to related event/item

---

## Phase 10: Dashboard & Reports

### 10.1 Updated Dashboard

**File: `app/store/dashboard/page.tsx` (web)**
**File: `dashboard-mobile/src/screens/DashboardScreen.tsx` (mobile)**

New dashboard widgets:
- Today's Sales (total amount)
- Items Sold (count)
- Low Stock Items (count with link)
- Recent Sales (list)
- Revenue by Category (chart)
- Branch Performance (chart)

### 10.2 Reports

**File: `app/store/reports/page.tsx` (web)**
**File: `dashboard-mobile/src/screens/ReportScreen.tsx` (mobile)**

Filters:
- Date range
- Event type (sale, transfer, receiving)
- Branch
- Payment method

Export options:
- PDF
- CSV

---

## Implementation Order

1. **Week 1:** Schema migration + brand color update
2. **Week 2:** Items CRUD + ecommerce-style grid
3. **Week 3:** Scanner integration + barcode lookup
4. **Week 4:** Checkout flow + cart state
5. **Week 5:** PayChangu payment integration
6. **Week 6:** Stock transfer + receiving
7. **Week 7:** Notifications + push notifications
8. **Week 8:** Auth hardening (JWT)
9. **Week 9:** Dashboard + reports update
10. **Week 10:** Testing + bug fixes

---

## Open Questions

1. **Exact blue hex:** Using #1D4ED8 (mid-to-deep blue). Confirm this matches store signage.
2. **Past checkouts location:** Implement as tab within Checkout screen (not separate Events view).
3. **Scanner mode param:** Use route param `mode=lookup|checkout` in React Navigation.
4. **PayChangu API:** Verify current API docs at implementation time for exact field names.

---

## Files to Modify

### Schema
- `drizzle/db/schema.ts` - Rename tables, add columns
- `drizzle/db/index.ts` - No changes needed
- `drizzle/seed.ts` - Complete rewrite for shoe retail data

### Web App
- `app/globals.css` - Update primary color
- `app/layout.tsx` - Update metadata
- `components/app-sidebar.tsx` - New navigation items
- `app/farm/` -> `app/store/` - Rename directory structure
- `app/api/` - Add new routes

### Mobile App
- `dashboard-mobile/src/constants/Theme.ts` - Update colors
- `dashboard-mobile/src/navigation/AppNavigator.tsx` - New screens
- `dashboard-mobile/src/context/AuthContext.tsx` - JWT support
- `dashboard-mobile/src/screens/` - Add new screens

### New Files
- `lib/auth.ts` - JWT utilities
- `lib/middleware.ts` - Auth middleware
- `lib/notifications.ts` - Notification helpers
- `lib/push.ts` - Push notification service
- `dashboard-mobile/src/context/CartContext.tsx` - Cart state
- `dashboard-mobile/src/screens/ScannerScreen.tsx` - Barcode scanner
- `dashboard-mobile/src/screens/ItemsScreen.tsx` - Product grid
- `dashboard-mobile/src/screens/CheckoutScreen.tsx` - POS checkout
- `dashboard-mobile/src/screens/NotificationsScreen.tsx` - Notifications
