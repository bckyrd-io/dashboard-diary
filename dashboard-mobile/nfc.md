# NFC compatibility notes

This app temporarily disables the native `react-native-nfc-manager` dependency so it can run in Expo Go without crashing or failing to load.

## Why this exists

The native NFC SDK is not available in Expo Go, and the app previously attempted to initialize it at runtime. That is safe for a development build or a real-device native build, but not for Expo Go.

## Current temporary behavior

- The app still keeps the NFC UI, flow, and navigation in place.
- NFC actions are replaced with a no-op/mock success path so the rest of the screen continues to function.
- This avoids blank screens and keeps the app usable in Expo Go while we continue development.

## Files involved

- `src/services/nfcService.ts` - compatibility shim / mock implementation.
- `src/screens/PaymentScreen.tsx` - uses the mock NFC payment flow.
- `src/screens/StaffScreen.tsx` - uses the mock tag scan flow.

## Restore steps for a real device / dev build

When moving to a development build or physical device with NFC support:

1. Re-enable the native module import in `src/services/nfcService.ts`.
2. Restore the original `startCardPayment`, `readProductTag`, `isSupported`, and `isEnabled` behavior.
3. Remove the mock `setTimeout`/generated tag responses.
4. Test the actual NFC hardware path on a real device.
5. Keep the UI and navigation as-is; the screens are already structured to work with the real native flow.

## Important note

This is intentionally a temporary compatibility layer only. The app should not ship in this mode for production NFC payment or tagging use.
