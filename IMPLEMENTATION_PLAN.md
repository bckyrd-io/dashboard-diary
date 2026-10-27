# The Sneaker Lounge — Mobile App Implementation Plan

## Product scope
The mobile app is the operational layer for a retail shoe business. It is designed around the day-to-day work of store staff and managers: scan products quickly, check out customers, manage stock movement between branches, handle scheduling and reminders, track staff activity via NFC, and review financial performance.

This is a mobile-first implementation, built with Expo + React Native, and it relies on the shared backend for persistence, user auth, stock operations, and reports.

## Current feature set in the mobile app
The current mobile app is centered on these 10 capabilities:

1. Barcode POS item scanning
2. Product checkout
3. Payment integration
4. Multi-branch stock transfer
5. Scheduling activities
6. Push/local notifications
7. NFC performance tracking
8. Revenue analytics reports
9. Offline/local persistence and sync-friendly behavior
10. Role-based authentication and access control

## Implementation status summary

| # | Feature | Status | Implementation summary |
|---|---------|--------|----------------------|
| 1 | Barcode POS item scanning | Implemented | `ScannerScreen.tsx` uses `expo-camera` to read barcodes, queries items by barcode, and adds to cart or opens item detail. |
| 2 | Product checkout | Implemented | `CheckoutScreen.tsx` + `CartContext.tsx` manage cart items, quantity edits, recent sales, and checkout navigation. |
| 3 | Payment integration | Implemented | `PaymentScreen.tsx` posts sale events to `/api/checkout` and supports cash and mobile-money payment flows. |
| 4 | Multi-branch stock transfer | Implemented | `BranchStockScreen.tsx` + `TransferContext.tsx` allow source branch selection, item selection, and transfer preparation. |
| 5 | Scheduling activities | Implemented | `ScheduleScreen.tsx` surfaces scheduled activities and upcoming reminders in the mobile calendar flow. |
| 6 | Push/local notifications | Partially implemented | `services/notifications.ts` schedules local notifications in Expo Go-compatible mode; full remote push token flow is still a production follow-up. |
| 7 | NFC performance tracking | Implemented (mock-safe for Expo Go) | `StaffScreen.tsx` + `services/nfcService.ts` read tag IDs and track productivity/check-ins; fallback mock behavior is used when native NFC is unavailable. |
| 8 | Revenue analytics reports | Implemented | `DashboardScreen.tsx` aggregates activity data, renders revenue/expense charts, and allows report export. |
| 9 | Offline/local syncing | Partially implemented | AsyncStorage-backed persistence for auth, cart, and transfer state makes the app resilient without a live connection, but it is not a full server-sync engine. |
| 10 | Role-based auth and access | Implemented | `AuthContext.tsx` + `AppNavigator.tsx` restore sessions, log users in, and restrict screens by role. |

## Architecture and implementation map

### Mobile app stack
- Expo SDK / React Native
- React Navigation (drawer + stack)
- AsyncStorage for persistence
- expo-camera for barcode scanning
- local notification APIs for reminders
- custom NFC shim to support Expo Go compatibility

### Primary implementation files
- `dashboard-mobile/src/navigation/AppNavigator.tsx` — role-based navigation and screen entry points
- `dashboard-mobile/src/context/AuthContext.tsx` — login/session handling
- `dashboard-mobile/src/context/CartContext.tsx` — checkout cart state
- `dashboard-mobile/src/context/TransferContext.tsx` — transfer queue and source branch state
- `dashboard-mobile/src/screens/ScannerScreen.tsx` — barcode scanning UI and item lookup
- `dashboard-mobile/src/screens/CheckoutScreen.tsx` — POS cart and recent sales
- `dashboard-mobile/src/screens/PaymentScreen.tsx` — payment confirmation and sale processing
- `dashboard-mobile/src/screens/BranchStockScreen.tsx` — multi-branch stock inventory flow
- `dashboard-mobile/src/screens/ScheduleScreen.tsx` — activity scheduling and reminder display
- `dashboard-mobile/src/screens/StaffScreen.tsx` — NFC staff accountability dashboard
- `dashboard-mobile/src/services/nfcService.ts` — NFC compatibility layer
- `dashboard-mobile/src/services/notifications.ts` — local notification scheduling
- `dashboard-mobile/src/screens/DashboardScreen.tsx` — analytics and revenue reporting

## Phase plan

### Phase 1 — POS and product lookup
Goal: enable fast product recognition and checkout at the counter.

Tasks:
- Complete barcode scanning workflow from camera to item lookup
- Support product add-to-cart flow for sales and quick inventory lookup
- Verify stock availability before finalizing checkout
- Keep the cart state resilient across app restarts through local storage

Deliverables:
- `ScannerScreen.tsx`
- `CheckoutScreen.tsx`
- `CartContext.tsx`
- item search by barcode using `/api/items`

### Phase 2 — Payment and sale completion
Goal: convert cart-to-sale without losing transaction integrity.

Tasks:
- Support cash and mobile-money checkout methods
- Send payment metadata to `/api/checkout`
- Capture payment reference, sale metadata, and sale event payloads
- Keep the success flow simple for both admin and staff users

Deliverables:
- `PaymentScreen.tsx`
- backend checkout route integration
- sale event history on the mobile checkout screen

### Phase 3 — Multi-branch stock movement and branch operations
Goal: support inventory flow between branches and stock control.

Tasks:
- Allow selecting the source branch and transfer targets
- Track transfer items in a persistent transfer state
- Provide branch inventory views with stock thresholds
- Validate stock before transfer operations are submitted

Deliverables:
- `BranchStockScreen.tsx`
- `TransferContext.tsx`
- destination-branch transfer logic and transfer events

### Phase 4 — Scheduling and reminders
Goal: convert calendar-like operational tasks into mobile reminders.

Tasks:
- Surface scheduled activities in one mobile place
- Add reminder triggers for upcoming action items
- Use local notifications for time-based reminders in Expo-compatible mode

Deliverables:
- `ScheduleScreen.tsx`
- `services/notifications.ts`
- reminder scheduling support for store activities

### Phase 5 — Workforce accountability and NFC timing
Goal: track who checked in and when, using NFC tag scans.

Tasks:
- Provide staff summary and activity tracking
- Read tag IDs and map them to staff/workstation associations
- Store check-ins and track attendance/performance state
- Keep an Expo Go-safe fallback in the app for non-native environments

Deliverables:
- `StaffScreen.tsx`
- `services/staffData.ts`
- `services/nfcService.ts`
- NFC-based accountability flow

### Phase 6 — Financial analytics and reporting
Goal: turn operational activity into revenue and performance visibility.

Tasks:
- Aggregate sales and activity totals by type
- Render revenue vs expense chart summaries
- Enable export/share options for reports
- Keep analytics aligned with the latest business events

Deliverables:
- `DashboardScreen.tsx`
- analytics dataset from `/api/dashboard`
- report export and filtering behavior

### Phase 7 — Access control and resilience
Goal: keep the app secure, usable, and robust in real-world conditions.

Tasks:
- Keep login and role validation centralized in `AuthContext.tsx`
- Restrict dashboard and admin actions by role in `AppNavigator.tsx`
- Persist sessions, cart state, and transfer state locally
- Prepare for true sync and push-token registration later

Deliverables:
- secure role gating
- offline-resilient local state
- production-ready auth and notification follow-up

## Current gaps and next improvements
The app is already close to a useful retail workflow, but the current implementation still has a few important production gaps:

- Native NFC support is intentionally mocked for Expo Go compatibility (`nfc.md`)
- Remote push notification registration is not fully implemented in Expo Go
- Offline behavior is persistence-based, not a true queued-synchronization system
- Revenue analytics are present, but may need business-specific metrics refinement for production reporting
- Full multi-branch transfer submission still depends on backend validation and operational policies

## Recommended product direction
The mobile experience should stay focused on the 10 operational capabilities above, with the following product principle:

- Fast retail actions first (scan, cart, checkout, pay)
- Inventory coordination second (transfer, stock visibility, low-stock awareness)
- Team accountability third (NFC check-ins, task timing, staff productivity)
- Decision support last (analytics, scheduling, notifications)

This gives the app a clear mobile operational identity rather than a broad “generic ERP” feel.
