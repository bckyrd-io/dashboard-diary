# The Sneaker Lounge - Mobile App Features

## Overview

The Sneaker Lounge mobile app is a retail point-of-sale (POS) and inventory management system built with Expo SDK 57 and React Native. It allows store staff to manage shoe inventory, process sales, track stock movements, and monitor store performance.

**Tech Stack:** Expo SDK 57, React Native 0.86.3, React Navigation 7, Lucide Icons, AsyncStorage

---

## Authentication

| Feature | Description |
|---------|-------------|
| **Login Screen** | Username/password authentication with secure bcrypt password hashing |
| **Session Persistence** | User session stored in AsyncStorage - stays logged in after app restart |
| **Role-Based Access** | Three roles: Admin, Staff, Cashier - each sees different menu items |
| **Logout** | Clear session and return to login screen |

### Role Permissions

| Screen | Admin | Staff | Cashier |
|--------|:-----:|:-----:|:-------:|
| Dashboard (Home) | ✅ | ❌ | ❌ |
| Items | ✅ | ✅ | ✅ |
| Branches | ✅ | ❌ | ❌ |
| Checkout | ✅ | ❌ | ✅ |
| Past Sales | ✅ | ❌ | ✅ |
| Events | ✅ | ✅ | ❌ |
| Schedule | ✅ | ✅ | ✅ |
| Notifications | ✅ | ❌ | ✅ |
| Performance | ✅ | ❌ | ❌ |
| Users | ✅ | ❌ | ❌ |
| Reports | ✅ | ❌ | ❌ |

---

## Screens

### 1. Landing Screen
- Welcome page with app branding
- "The Sneaker Lounge - Home of Shoes and Other Accessories"
- Feature highlights for Admin and Staff
- "Get Started" button navigates to Login

### 2. Login Screen
- Username and password input fields
- Show/hide password toggle
- Loading indicator during authentication
- Error messages for failed login
- Shoe emoji branding

### 3. Dashboard Screen (Admin only)
- **Stat Cards:**
  - Total Sales (MWK amount)
  - Total Items (count)
  - Low Stock Alerts (count with warning color)
  - Recent Orders (count)
- **Recent Sales List:** Last 5 sales with description, date, amount
- Pull-to-refresh

### 4. Items Screen (Ecommerce Grid)
- **Search Bar:** Filter items by name
- **Category Filter Chips:** All, Office Shoes, Casual Shoes, Sports Shoes, Designer Shoes
- **Product Grid:** 2-column card layout
  - Product image or placeholder icon
  - Product name
  - Category label
  - Price (MWK)
  - Stock status badge (In Stock / Low Stock / Out of Stock)
- **FAB Button:** Navigate to Add Item screen
- Pull-to-refresh

### 5. Item Detail Screen
- Product image (or placeholder)
- Product name and price
- Stock status badge
- **Product Information Section:**
  - Category
  - Barcode (if set)
  - SKU (if set)
  - Cost price (if set)
  - Reorder threshold (if set)
- **Stock Information Section:**
  - Current stock quantity
  - Reorder point
- **Actions:**
  - Edit button → Add Item screen (pre-filled)
  - Delete button (with confirmation)

### 6. Add Item Screen
- **Form Fields:**
  - Product Name (required)
  - Category picker (Office/Casual/Sports/Designer Shoes)
  - Barcode (optional)
  - SKU (optional)
  - Selling Price (required, MWK)
  - Cost Price (optional, MWK)
  - Quantity
  - Unit (default: "pairs")
  - Low Stock Alert Threshold
- Works for both Create and Edit modes
- Validation with error alerts

### 7. Checkout Screen (POS)
- **Header:** Title + Scan button
- **Cart List:**
  - Item name and unit price
  - Quantity controls (+ / - / manual input)
  - Line total calculation
  - Remove item button
- **Empty Cart State:** Icon + hint text
- **Payment Section:**
  - Payment method selector:
    - Cash
    - Airtel Money
    - TNM Mpamba
  - Total amount display
  - "Pay Now" button
- **Cart Persistence:** Saved to AsyncStorage (survives app restart)

### 8. Scanner Screen
- **Full-screen camera view**
- **Barcode scanning** (EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39)
- **Modes:**
  - `lookup`: From Items tab → shows item details
  - `checkout`: From Checkout → adds item to cart
- **Features:**
  - Flash toggle
  - Scan frame overlay with corner markers
  - Loading indicator during lookup
- **Item Found:**
  - Lookup mode: Navigate to ItemDetail
  - Checkout mode: Add to cart, show confirmation
- **Item Not Found:**
  - Alert with option to create new item (barcode pre-filled)
- **Camera Permission:**
  - Permission request dialog
  - Grant Permission button
  - Cancel button

### 9. Past Sales Screen
- **Summary Header:**
  - Total sales count
  - Total revenue amount
- **Sales List:**
  - Transaction description
  - Date
  - Amount (MWK)
  - Payment method icon + label
  - Payment status badge (Success/Failed/Pending)
- Tap to view event details
- Pull-to-refresh

### 10. Events Screen
- **Filter Chips:** All, Sale, Transfer, Receiving
- **Event List:**
  - Event type icon (color-coded)
  - Event type label
  - Date
  - Description
  - Amount (if applicable)
  - Payment status badge
- Tap to view event details
- Pull-to-refresh

### 11. Event Detail Screen
- **Event Type Badge:** Colored badge (Sale=green, Transfer=blue, Receiving=yellow)
- **Description:** Full event description
- **Amount Card:** Large centered amount display
- **Details Section:**
  - Date
  - Payment method
  - Payment status (with colored badge)
  - Payment reference (if set)
- **Items Section:**
  - List of items in the event
  - Quantity x Unit price
  - Line total

### 12. Schedule Screen
- Calendar view with dot markers for scheduled events
- Notification modal for upcoming alerts

### 13. Notifications Screen
- **Header Info:** Unread count badge
- **Notification List:**
  - Type icon (color-coded):
    - Low Stock: Warning triangle (yellow)
    - Payment: Credit card (green)
    - Reminder: Calendar (blue)
    - Assignment: User check (blue)
  - Title (bold if unread)
  - Body text (2 lines max)
  - Time ago (Just now, Xm ago, Xh ago, Xd ago)
  - Unread dot indicator
- Tap to mark as read
- Pull-to-refresh

### 14. Branches Screen (Admin only)
- List of store branches
- Branch name and location
- Staff count per branch
- Pull-to-refresh

### 15. Add Branch Screen (Admin only)
- Form with Branch Name and Location fields
- Create new branch

### 16. Users Screen (Admin only)
- List of user accounts
- User avatar (first letter)
- Username, email, role badge
- Pull-to-refresh

### 17. Add User Screen (Admin only)
- Branch selector (chip picker)
- Username, email, password fields
- Create new user

### 18. Performance Screen (Admin only)
- Staff performance tracking
- Staff-to-event assignments
- Status badges (Assigned, In Progress, Completed)

### 19. Report Screen (Admin only)
- Activity report list
- Search and filter
- Export via Share API

---

## Navigation Structure

### Drawer Menu (Grouped)

```
OVERVIEW
  Home (LayoutDashboard)

CATALOG
  Items (Tag)
  Branches (Building)

OPERATIONS
  Checkout (CreditCard)
  Past Sales (ShoppingCart)
  Events (Receipt)
  Schedule (CalendarDays)
  Notifications (Bell)

PEOPLE
  Performance (BarChart3)
  Users (Users)

INSIGHTS
  Reports (BarChart3)
```

### Stack Navigator (Modal Screens)
- ItemDetail
- AddItem
- Scanner
- EventDetail
- AddBranch (Admin only)
- AddUser (Admin only)

---

## API Integration

### Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/users/login` | POST | Authenticate user |
| `/api/items` | GET/POST/PUT/DELETE | CRUD for products |
| `/api/items/[id]` | GET/PATCH/DELETE | Single item operations |
| `/api/events` | GET/POST | List/create events |
| `/api/events/[id]` | GET/PATCH | Single event with line items |
| `/api/checkout` | POST | Process sale transaction |
| `/api/branches` | GET/POST | List/create branches |
| `/api/users` | GET/POST | List/create users |
| `/api/notifications` | GET/POST | List/create notifications |
| `/api/notifications/[id]/read` | POST | Mark notification as read |
| `/api/performance` | GET/POST | Staff performance records |
| `/api/schedules` | GET | Calendar events |

### Data Flow

1. **Login:** POST `/api/users/login` → Store user in AsyncStorage
2. **Fetch Items:** GET `/api/items` → Display in grid
3. **Add to Cart:** Client-side state + AsyncStorage persistence
4. **Checkout:** POST `/api/checkout` → Creates event, deducts stock
5. **Notifications:** GET `/api/notifications` → Display in list

---

## Data Models

### Item
```typescript
{
  id: number;
  name: string;
  category: string;           // "physical-product" | "service"
  subCategory: string;        // "Office Shoes" | "Casual Shoes" | etc.
  barcode: string | null;
  sku: string | null;
  price: number;              // Sell price in MWK
  costPrice: number | null;
  quantity: number;           // Stock count
  unit: string | null;
  reorderThreshold: number | null;
  imageUrl: string | null;
  branchId: number | null;
}
```

### Event
```typescript
{
  id: number;
  eventType: string;          // "sale" | "transfer" | "receiving"
  financialType: string;      // "Revenue" | "Expense" | "Neutral"
  description: string;
  amount: number;
  date: string;
  branchId: number | null;
  toBranchId: number | null;
  paymentMethod: string | null;  // "cash" | "airtel_money" | "tnm_mpamba"
  paymentStatus: string | null;  // "pending" | "success" | "failed"
}
```

### CartItem
```typescript
{
  itemId: number;
  name: string;
  price: number;
  quantity: number;
  barcode: string | null;
  imageUrl: string | null;
}
```

### Notification
```typescript
{
  id: number;
  userId: number;
  type: string;               // "low_stock" | "payment_status" | "event_reminder" | "assignment"
  title: string;
  body: string;
  isRead: boolean;
  relatedEventId: number | null;
  relatedItemId: number | null;
}
```

---

## Design System

### Colors
- **Primary:** #1D4ED8 (Blue)
- **Success:** #16a34a (Green)
- **Warning:** #f59e0b (Yellow)
- **Error:** #dc2626 (Red)
- **Background:** #ffffff
- **Muted:** #f9fafb
- **Border:** #e1e4e8

### Design Tokens
- **Border Radius:** 6px (Theme.radius)
- **Shadows:** Subtle (Theme.shadowSm) - shadowOpacity: 0.05
- **Font Sizes:** 11-24px range

### Component Patterns
- **Cards:** Border only, no heavy shadows
- **Badges:** Small, rounded, color-coded
- **Buttons:** Primary (blue), outline, ghost
- **Inputs:** Border with muted background

---

## Seed Data

### Branches
1. The Sneaker Lounge - Main Store (City Centre)
2. The Sneaker Lounge - Mall Branch (Game City Mall)
3. The Sneaker Lounge - Warehouse (Industrial Area)

### Users
| Username | Role | Branch |
|----------|------|--------|
| admin | admin | Main Store |
| grace_mwangi | Cashier | Main Store |
| peter_banda | Staff | Main Store |
| mary_phiri | Cashier | Mall Branch |

### Products (12 items)
| Name | Category | Price (MWK) | Stock |
|------|----------|-------------|-------|
| Classic Oxford Brogue | Office Shoes | 45,000 | 24 |
| Executive Derby Shoe | Office Shoes | 38,000 | 18 |
| Professional Loafer | Office Shoes | 35,000 | 30 |
| Urban Sneaker Classic | Casual Shoes | 28,000 | 45 |
| Canvas Slip-On | Casual Shoes | 22,000 | 60 |
| Leather Boat Shoe | Casual Shoes | 32,000 | 20 |
| Running Performance | Sports Shoes | 55,000 | 15 |
| Basketball High-Top | Sports Shoes | 65,000 | 12 |
| Training Cross-Fit | Sports Shoes | 48,000 | 22 |
| Italian Leather Oxford | Designer Shoes | 120,000 | 8 |
| Handcrafted Monk Strap | Designer Shoes | 95,000 | 10 |
| Premium Suede Chelsea | Designer Shoes | 85,000 | 6 |

### Test Barcodes
- `TSL-OF-001` through `TSL-OF-003` (Office)
- `TSL-CA-001` through `TSL-CA-003` (Casual)
- `TSL-SP-001` through `TSL-SP-003` (Sports)
- `TSL-DE-001` through `TSL-DE-003` (Designer)

---

## Default Login Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| grace_mwangi | staff123 | Cashier |
| peter_banda | staff123 | Staff |
| mary_phiri | staff123 | Cashier |

---

## File Structure

```
dashboard-mobile/
├── App.tsx                          # Root component with providers
├── index.ts                         # Entry point
├── package.json                     # Dependencies
└── src/
    ├── constants/
    │   └── Theme.ts                 # Colors, design tokens
    ├── context/
    │   ├── AuthContext.tsx           # Authentication state
    │   └── CartContext.tsx           # Shopping cart state
    ├── navigation/
    │   └── AppNavigator.tsx         # Drawer + Stack navigation
    ├── screens/
    │   ├── LandingScreen.tsx        # Welcome page
    │   ├── LoginScreen.tsx          # Authentication
    │   ├── DashboardScreen.tsx      # Admin dashboard
    │   ├── ItemsScreen.tsx          # Product grid
    │   ├── ItemDetailScreen.tsx     # Product details
    │   ├── AddItemScreen.tsx        # Create/edit product
    │   ├── CheckoutScreen.tsx       # POS checkout
    │   ├── ScannerScreen.tsx        # Barcode scanner
    │   ├── PastCheckoutsScreen.tsx  # Sales history
    │   ├── EventsScreen.tsx         # Event log
    │   ├── EventDetailScreen.tsx    # Event details
    │   ├── BranchesScreen.tsx       # Branch list
    │   ├── AddBranchScreen.tsx      # Create branch
    │   ├── UsersScreen.tsx          # User list
    │   ├── AddUserScreen.tsx        # Create user
    │   ├── StaffScreen.tsx          # Performance
    │   ├── ScheduleScreen.tsx       # Calendar
    │   ├── ReportScreen.tsx         # Reports
    │   └── NotificationsScreen.tsx  # Notifications
    ├── services/
    │   └── api.ts                   # HTTP client
    ├── components/
    │   └── ui/index.tsx             # Shared UI components
    └── types/
        └── navigation.ts           # Navigation types
```
