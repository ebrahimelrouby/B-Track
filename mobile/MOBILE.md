# B-Track Mobile

React Native 0.79.4 app (New Architecture / Bridgeless, React 19) for iOS and
Android. Companion Apple Watch (watchOS/SwiftUI) and Wear OS (Kotlin/Compose)
apps live under `ios/BTrackWatch/` and `android/wear/`.

## Tech stack

- React Native 0.79.4, React 19, TypeScript
- `@react-navigation` (native-stack + bottom-tabs)
- `@tanstack/react-query` (server state) + `zustand` + MMKV (client/persisted state)
- `axios` for HTTP, `react-native-iap` for in-app purchases
- `react-i18next` (English/Arabic, RTL-aware)
- Jest + `@testing-library`-style unit tests

## Running locally

```
npm install
cd ios && pod install && cd ..   # iOS only
npm run ios     # or: npm run android
```

The backend must be running on `localhost:8080` (see
[backend/BACKEND.md](../backend/BACKEND.md)) — Android emulators can't reach
`localhost` directly, so `API_BASE_URL` auto-switches to `10.0.2.2:8080` on
Android in dev (see `src/constants/config.ts`). Physical devices need your
machine's LAN IP instead of `localhost`.

```
npm test          # Jest — 9 tests
npm run type-check # tsc --noEmit
npm run lint
```

## Configuration

**Important:** `.env.example` exists at the repo root but nothing in the app
actually reads `process.env` — there's no `react-native-dotenv`/`babel`
plugin wired up for it. All runtime config is a plain TypeScript constant in
**`src/constants/config.ts`**:

```ts
export const USE_MOCK_API = false;        // true = fully offline, local storage only
export const API_BASE_URL = ...;          // dev: localhost/10.0.2.2, prod: https://api.btrack.app/api/v1
export const IAP_PRODUCTS = { ... };      // App Store / Play Store product IDs
```

Edit this file directly to point at a different backend or toggle mock mode.

### Keys / IDs needed for full functionality

| What | Where it's set | Where it comes from |
|---|---|---|
| Backend reachability | `API_BASE_URL` in `config.ts` | — |
| IAP product IDs | `IAP_PRODUCTS` in `config.ts` | Must exactly match subscription products created in **App Store Connect** and **Google Play Console** |
| iOS bundle ID | `ios/BTrack.xcodeproj` (`PRODUCT_BUNDLE_IDENTIFIER`) | Must match backend's `APPLE_IAP_BUNDLE_ID` |
| Android package | `android/app/build.gradle` (`applicationId`, currently `com.btrackscaffold`) | Must match backend's `GOOGLE_PLAY_PACKAGE_NAME` |

There are **no client-side API keys** for AI or payments — the Gemini key and
Apple/Google/Stripe credentials all live server-side only (see backend docs).
The app never talks to Apple/Google/Gemini directly for anything
security-sensitive; it only ever hits your own backend.

## Architecture

- `src/navigation/` — `AppNavigator` (root, switches Auth/Onboarding/Main
  based on `auth.store`), `AuthNavigator`, `OnboardingNavigator`,
  `MainNavigator` (tabs), `WorkoutNavigator`, `HealthNavigator`, `AiNavigator`.
- `src/store/` — zustand stores, MMKV-persisted: `auth.store` (tokens, user,
  entitlements), `activeWorkout.store`, `theme.store`, `language.store`.
- `src/api/` — one file per backend module (`auth.api.ts`, `workout.api.ts`,
  `health.api.ts`, `recovery.api.ts`, `ai.api.ts`, `subscription.api.ts`,
  `user.api.ts`), all going through the shared `client.ts` axios instance
  (attaches JWT, auto-refreshes on 401, redirects to login if refresh fails).
- `src/screens/` — one folder per feature area (`workout`, `nutrition`,
  `sleep`, `steps`, `water`, `measurements`, `recovery`, `ai`, `premium`,
  `profile`, `onboarding`, `auth`, `analytics`, `notifications`, `progress`).

### What's actually wired to the backend vs. mock-only

Everything below is **live** (calls the real backend when `USE_MOCK_API=false`):
auth, workout plans/sessions, sleep, steps, measurements, recovery, AI
food/body estimation, subscriptions/entitlements.

**`nutrition.api.ts` is not wired yet** — `searchFoods`/`getFoodById` always
resolve empty/null and `logFood` always rejects with "Not connected" when not
in mock mode, even though the backend's `/nutrition/*` endpoints are fully
implemented (see backend docs). The nutrition/water screens currently only
work with `USE_MOCK_API=true`. Wiring this up is a matter of replacing the
`Promise.resolve/reject` stubs in `nutrition.api.ts` with real `apiClient`
calls, following the same pattern as `health.api.ts`.

## Payment / IAP integration flow

`src/screens/premium/UpgradeScreen.tsx` uses the `useIAP()` hook from
`react-native-iap`:

1. On mount, fetches live store prices via `getSubscriptions()`.
2. User taps a plan → `requestSubscription()` (Android needs the specific
   `offerToken` from `subscriptionOfferDetails`, iOS just needs the SKU). A
   30s safety timeout resets the button if neither success nor error ever
   fires (covers Ask-to-Buy/pending-approval cases).
3. On `currentPurchase`, the raw receipt (`transactionReceipt` on iOS,
   `purchaseToken` on Android) is POSTed to the backend's
   `/subscriptions/verify` — **never trust the local receipt directly**, the
   backend re-verifies it against Apple/Google before granting anything.
4. On success: `finishTransaction()`, then entitlements are written to both
   `auth.store` and the `['entitlements']` react-query cache (kept in sync
   so a background refetch in `AppNavigator` can't clobber a fresh purchase).
5. "Restore Purchases" re-verifies every `getAvailablePurchases()` result the
   same way; the final message reflects actual success/failure count instead
   of always claiming success.

Client-side entitlement gating (`usePremiumFeature`/`usePlanLimit` hooks)
reads from `auth.store.entitlements`, which `AppNavigator` keeps populated by
polling `GET /subscriptions/entitlements` (via react-query) whenever
`isAuthenticated` is true — without this, the app would never reflect a
successful purchase client-side.

## Companion apps

- **Apple Watch** (`ios/BTrackWatch/`, SwiftUI): mirrors active-workout state
  via `WCSession`; bridged through `src/native/watch.ts`. Requires a
  manually-created watchOS Xcode target (not committed as a scheme) — see the
  Sources under `ios/BTrackWatch/Sources/BTrackWatch/`.
- **Wear OS** (`android/wear/`, Jetpack Compose): mirrors the same workout
  state via the Android Data Layer API.

Neither needs its own backend credentials — they only mirror state the phone
app already has.
