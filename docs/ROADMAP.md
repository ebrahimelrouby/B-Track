# B-Track Development Roadmap

## Phase 1 — Foundation (Weeks 1–3) ✅ SCAFFOLDED
**Goal:** Core auth flow, workout tracking, and offline sync working end-to-end.

### Backend
- [x] Spring Boot project setup (pom.xml, application.yml)
- [x] PostgreSQL + Flyway migrations (V1–V7)
- [x] JWT authentication (register/login/refresh/logout)
- [x] User entity + profile entity
- [x] Subscription entity + entitlement service
- [x] Exercise catalog seeded (27 exercises)
- [x] Workout plan / day / exercise entities
- [x] Workout session + sets entities
- [x] Offline sync endpoint (POST /sessions/sync)
- [x] Docker + Docker Compose
- [ ] Connect remaining stubs (nutrition, water, analytics)
- [ ] Unit tests (AuthService, SubscriptionService)
- [ ] Integration tests (session sync flow)

### Mobile
- [x] React Native CLI project structure
- [x] Theme system (dark mode, neon green accent)
- [x] Navigation (Auth → Onboarding → Main → Workout)
- [x] Auth screens (Login, Register, Forgot Password)
- [x] Onboarding wizard (5 steps + macro calculation)
- [x] Zustand stores (auth, active workout — MMKV persisted)
- [x] TanStack Query + Axios client with JWT refresh
- [x] Dashboard screen (calories, macros, stats, AI tip)
- [x] Workout Plans screen
- [x] Create Plan screen
- [x] Plan Detail screen (days, start workout)
- [x] Active Workout screen (set logging, rest timer, haptics)
- [x] Workout Summary screen
- [x] Exercise List screen (search + muscle filter)
- [x] Offline sync (workout saved locally → synced when online)
- [x] Feature gate system (usePremiumFeature hook)
- [x] Locked Feature screen + Upgrade screen
- [ ] Wire up real Apple IAP (react-native-iap)
- [ ] Push notification setup
- [ ] HealthKit steps/sleep integration

---

## Phase 2 — Nutrition & Water (Weeks 4–5)
**Goal:** Full MyFitnessPal-style nutrition tracker.

### Backend
- [ ] FoodItem entity + search API
- [ ] Meal / MealItem CRUD
- [ ] Water log API
- [ ] Nutrition daily summary endpoint
- [ ] Barcode lookup (OpenFoodFacts integration)

### Mobile
- [ ] Nutrition tab: daily diary, meal sections, macros ring
- [ ] Food search screen (search + barcode scanner)
- [ ] Add food to meal screen
- [ ] Custom food creation
- [ ] Water tracker (quick-add buttons, daily progress)
- [ ] Meal templates (Premium)
- [ ] Copy meals from previous day

---

## Phase 3 — Progress & Analytics (Weeks 6–7)
**Goal:** Charts, body measurements, progress photos.

### Backend
- [ ] Body measurement CRUD
- [ ] Progress photo upload (S3/Cloudflare R2)
- [ ] Analytics endpoints (weight trend, volume trend, PR history)

### Mobile
- [ ] Progress tab: body weight chart (Victory Native)
- [ ] Body measurements form
- [ ] Progress photo gallery (free: 5, premium: unlimited)
- [ ] Strength progress chart per exercise
- [ ] Workout volume by muscle group (Premium)
- [ ] Personal records list

---

## Phase 4 — Health Integration & Steps (Weeks 8–9)
**Goal:** HealthKit / Health Connect integration.

### Mobile
- [ ] HealthKit permissions flow (iOS)
- [ ] Steps today + weekly chart
- [ ] Sleep duration + quality (if available)
- [ ] Write workout calories to HealthKit
- [ ] Health Connect integration (Android)

---

## Phase 5 — AI Coach (Weeks 10–11) — Premium Only
**Goal:** AI-powered coaching with Claude API.

### Backend
- [ ] AI conversation entity
- [ ] Rate limiting (10 req/min, 100 req/day per user)
- [ ] Subscription gate on all AI endpoints
- [ ] Context builder (user profile + recent workouts + nutrition)
- [ ] Claude claude-sonnet-4-6 integration (Anthropic SDK)
- [ ] AI disclaimer in response metadata

### Mobile
- [ ] AI Coach chat screen (bubble UI)
- [ ] Suggested progressive overload in Active Workout
- [ ] Weak muscle group detection card on Dashboard
- [ ] Gate screen for free users

---

## Phase 6 — Apple Watch (Weeks 12–13) — Premium Only
**Goal:** Full Watch companion app.

### Watch App
- [ ] WCSession delegate in React Native iOS bridge
- [ ] Native module: WatchConnectivityBridge
- [ ] Watch UI: Idle → Active Workout → Log Set → Summary
- [ ] HealthKit heart rate during workout
- [ ] Rest timer complication
- [ ] Sync completed watch workout to iPhone → backend

---

## Phase 7 — Polish & Launch Prep (Weeks 14–15)
**Goal:** Quality, testing, App Store submission.

- [ ] Skeleton loading states everywhere
- [ ] Empty states with illustrations
- [ ] Error states + retry
- [ ] Haptic feedback audit
- [ ] Swipe to delete (meals, sets, exercises)
- [ ] Dark mode QA on multiple device sizes
- [ ] Crash reporting (Sentry)
- [ ] Performance profiling
- [ ] App Store screenshots
- [ ] Privacy Policy + Terms of Service
- [ ] Apple App Review guidelines compliance check
- [ ] TestFlight beta
- [ ] Google Play internal test

---

## Architecture Decisions

| Decision | Choice | Why |
|---|---|---|
| State management | Zustand | Simple, performant, no boilerplate |
| Server state | TanStack Query | Auto caching, refetching, optimistic updates |
| Forms | React Hook Form + Zod | Type-safe, performant, no re-renders |
| Persistence | MMKV | 10x faster than AsyncStorage |
| Navigation | React Navigation | De-facto standard for RN CLI |
| Backend | Spring Boot 3.x / Java 21 | Strong typing, JPA, battle-tested |
| DB | PostgreSQL | Best for relational fitness data + arrays |
| DB migrations | Flyway | Simple, reliable, version-controlled |
| Auth | JWT (access 15min + refresh 30d) | Stateless, mobile-friendly |
| Payments | react-native-iap | Official library for both platforms |
| AI | Claude claude-sonnet-4-6 | Best instruction following, low latency |
| Watch | Native SwiftUI + WCSession | Required for Watch OS, WKExtension deprecated |
| Offline | Zustand MMKV + sync endpoint | Workout logs work offline, sync on reconnect |
