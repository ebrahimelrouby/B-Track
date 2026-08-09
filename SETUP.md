# B-Track — Full Project Setup Guide

Everything you need to run all three layers: **Backend API**, **Mobile App**, and **Admin Web**.

---

## Project Structure

```
B-Track/
├── backend/          Spring Boot 3.2.5 · Java 21 · PostgreSQL
├── mobile/           React Native 0.79.4 · TypeScript · New Architecture
├── admin-web/        React 18 · Vite · TailwindCSS
└── docs/
```

---

## 1. Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Java | 21 (LTS) | https://adoptium.net |
| Maven | 3.9+ | https://maven.apache.org |
| PostgreSQL | 15+ | https://postgresql.org or `brew install postgresql@15` |
| Node.js | 18+ LTS | https://nodejs.org |
| npm | 10+ | bundled with Node |
| Ruby | 3.2+ (iOS only) | `brew install ruby` |
| CocoaPods | latest (iOS) | `sudo gem install cocoapods` |
| Xcode | 15+ (iOS) | Mac App Store |
| Android Studio | latest (Android) | https://developer.android.com/studio |

---

## 2. Database Setup

```sql
-- Run in psql as a superuser
CREATE DATABASE btrack;
CREATE USER btrack WITH PASSWORD 'btrack';
GRANT ALL PRIVILEGES ON DATABASE btrack TO btrack;
\c btrack
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

Or with a single command:
```bash
psql -U postgres -c "CREATE DATABASE btrack; CREATE USER btrack WITH PASSWORD 'btrack'; GRANT ALL PRIVILEGES ON DATABASE btrack TO btrack;"
```

Flyway runs all migrations automatically on first startup. No manual SQL needed.

---

## 3. Backend (Spring Boot)

### 3.1 Environment Variables

Create a `.env` file or export these in your terminal before running:

```bash
# Database
DB_URL=jdbc:postgresql://localhost:5432/btrack
DB_USERNAME=btrack
DB_PASSWORD=btrack

# JWT — CHANGE THIS IN PRODUCTION (must be 256-bit / 32+ chars)
JWT_SECRET=btrack-super-secret-jwt-key-change-this-in-production-256bit

# JWT expiry (seconds)
JWT_ACCESS_EXPIRY=900        # 15 minutes
JWT_REFRESH_EXPIRY=2592000   # 30 days

# OpenAI — required for AI Food Estimation + Body Fat Estimation features
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Spring profile
SPRING_PROFILES_ACTIVE=dev

# Server port (optional, defaults to 8080)
PORT=8080
```

> **Where to get OPENAI_API_KEY:** https://platform.openai.com/api-keys
> Model used: `gpt-4o` (vision-capable, required for body fat and food photo features)
> Cost: ~$0.005 per food photo analysis, ~$0.01 per body fat analysis

### 3.2 Run the Backend

```bash
cd /Users/ElRouby/Downloads/B-Track/backend

# Export env vars (or use a tool like direnv)
export DB_URL=jdbc:postgresql://localhost:5432/btrack
export DB_USERNAME=btrack
export DB_PASSWORD=btrack
export JWT_SECRET=btrack-super-secret-jwt-key-change-this-in-production-256bit
export OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
export SPRING_PROFILES_ACTIVE=dev

# Build and run
mvn spring-boot:run

# Or build JAR first, then run
mvn clean package -DskipTests
java -jar target/btrack-backend-1.0.0-SNAPSHOT.jar
```

**Flyway automatically runs all 12 migrations on startup** — including seeding 25 exercises and creating the admin user.

### 3.3 Verify Backend

```bash
curl http://localhost:8080/actuator/health
# → {"status":"UP"}

# Swagger UI
open http://localhost:8080/swagger-ui.html
```

---

## 4. Default Admin Credentials

These are seeded by `V12__seed_admin_user.sql` on first startup.

| Field | Value |
|-------|-------|
| Email | `admin@btrack.app` |
| Password | `Admin@12345` |
| Role | `SUPER_ADMIN` |

> **IMPORTANT:** Change this password immediately after first login.
> Use the API: `PATCH /api/v1/users/me` or update directly in the DB.

To create additional admin users:
```sql
-- In psql
UPDATE users SET role = 'ADMIN' WHERE email = 'someone@example.com';
-- or role = 'SUPER_ADMIN' for full access
```

**Role permissions:**
| Role | Can do |
|------|--------|
| `USER` | Mobile app only |
| `PREMIUM_USER` | Mobile app + premium features |
| `ADMIN` | Admin web: manage exercises, import, media, translations |
| `SUPER_ADMIN` | All of the above + delete exercises, run imports, view full audit log |

---

## 5. Admin Web App

### 5.1 Install and Run

```bash
cd /Users/ElRouby/Downloads/B-Track/admin-web
npm install
npm run dev
```

Opens at **http://localhost:5173**

Vite automatically proxies `/api` → `http://localhost:8080`, so the backend must be running.

### 5.2 Login

| Field | Value |
|-------|-------|
| URL | http://localhost:5173 |
| Email | `admin@btrack.app` |
| Password | `Admin@12345` |

### 5.3 Admin Web Features (15 screens)

| Screen | URL | What it does |
|--------|-----|--------------|
| Login | `/login` | JWT auth, admin-only |
| Dashboard | `/` | Stats overview, charts |
| Exercise List | `/exercises` | Browse all statuses, filter, paginate |
| Exercise Detail | `/exercises/:id` | View + status workflow buttons |
| Create Exercise | `/exercises/create` | New exercise (starts as DRAFT) |
| Edit Exercise | `/exercises/:id/edit` | Edit all fields |
| Quality Review | `/exercises/quality` | Review drafts, field completeness |
| Bulk Edit | `/exercises/bulk-edit` | Select multiple → change status |
| Duplicate Review | `/exercises/duplicates` | Find + archive duplicates |
| Import Wizard | `/import` | Import from external providers |
| Import History | `/import/history` | Past import runs + stats |
| Media Manager | `/media` | Attach/remove images, GIFs, videos |
| Translation Manager | `/translations` | AR / FR / ES / DE translations |
| Audit Log | `/audit-log` | SUPER_ADMIN only — all actions |

### 5.4 Exercise Status Workflow

```
DRAFT → REVIEWED → PUBLISHED → ARCHIVED
  ↘                          ↗
   └──────── REJECTED ───────┘
```

- Mobile app only shows `PUBLISHED` exercises
- All imported exercises start as `DRAFT`
- Custom user exercises (created in mobile app) bypass status entirely

---

## 6. Mobile App

### 6.1 Install Dependencies

```bash
cd /Users/ElRouby/Downloads/B-Track/mobile
npm install
```

### 6.2 iOS Setup

```bash
cd ios
bundle install          # installs CocoaPods gem via Bundler
bundle exec pod install # installs all native dependencies
cd ..
```

### 6.3 Run Mobile App

```bash
cd /Users/ElRouby/Downloads/B-Track/mobile

# Start Metro bundler (IMPORTANT: always reset cache after dependency changes)
npx react-native start --reset-cache

# In a separate terminal — iOS Simulator
npx react-native run-ios

# Android Emulator (make sure emulator is running first)
npx react-native run-android
```

### 6.4 Backend URL for Mobile

The mobile app points to the backend. In development with a simulator:
- **iOS Simulator:** `http://localhost:8080` works directly
- **Android Emulator:** use `http://10.0.2.2:8080`
- **Physical device:** use your machine's LAN IP, e.g. `http://192.168.1.x:8080`

Update the API base URL in:
```
mobile/src/api/client.ts   (or wherever axios is configured)
```

### 6.5 Critical Build Notes (RN 0.79 New Architecture)

These are REQUIRED for the app to work — already applied, but don't revert them:

| File | What it does |
|------|-------------|
| `babel.config.js` | `react-native-reanimated/plugin` MUST be last in plugins array — removing it breaks drag-to-reorder and all worklet animations |
| `App.tsx` | `enableScreens()` must be called before any navigation renders |
| `package.json` | `react-native-mmkv` must be v3.x (v2.x uses Old Architecture bridge) |
| `ExerciseMediaView.tsx` | Uses `opacity: 0` not `display: 'none'` — iOS New Architecture blocks `onLoad`/`onError` when display is none |

---

## 7. API Reference

Base URL: `http://localhost:8080/api/v1`
Full Swagger: `http://localhost:8080/swagger-ui.html`

### Auth Endpoints (public)
```
POST /auth/register       Register new user
POST /auth/login          Login → returns accessToken + refreshToken
POST /auth/refresh        Refresh access token
POST /auth/logout         Revoke refresh tokens
```

### Mobile Endpoints (JWT required)
```
GET  /exercises            Search exercises (PUBLISHED only)
POST /exercises            Create custom exercise
GET  /users/me             Get profile
PATCH /users/me            Update profile
POST /ai/nutrition/analyze Analyze food photo (OpenAI)
POST /ai/body/analyze      Analyze body fat photo (OpenAI)
...many more (see Swagger)
```

### Admin Endpoints (ADMIN or SUPER_ADMIN JWT)
```
GET  /admin/dashboard/stats
GET  /admin/exercises                    Filter by status, muscle, etc.
POST /admin/exercises                    Create exercise
PUT  /admin/exercises/{id}               Update exercise
PATCH /admin/exercises/{id}/status       Transition status
POST /admin/exercises/bulk-status        Bulk status change
DELETE /admin/exercises/{id}             (SUPER_ADMIN only)
GET  /admin/exercises/{id}/media         List media
POST /admin/exercises/{id}/media         Add media URL
DELETE /admin/exercises/{id}/media/{mid} Remove media
GET  /admin/exercises/{id}/translations  List translations
PUT  /admin/exercises/{id}/translations/{locale}  Save translation
GET  /admin/exercises/{id}/duplicates    Find duplicates
GET  /admin/exercises/import/providers   List import sources
POST /admin/exercises/import             Run import (SUPER_ADMIN)
GET  /admin/exercises/import/history     Import history
GET  /admin/audit-log                    Audit log (SUPER_ADMIN)
```

### Auth Header Format
```
Authorization: Bearer eyJhbGciOi...
```

---

## 8. AI Features (OpenAI)

Two AI features exist, both require `OPENAI_API_KEY` set in backend env.

| Feature | Endpoint | Model | Approx cost |
|---------|----------|-------|-------------|
| Food Macro Estimation | `POST /api/v1/ai/nutrition/analyze` | gpt-4o | ~$0.005/call |
| Body Fat Estimation | `POST /api/v1/ai/body/analyze` | gpt-4o | ~$0.01/call |

**Rate limits (configurable in application.yml):**
- 10 requests per minute per user
- 100 requests per day per user

**Privacy rules (hardcoded — do not bypass):**
- Never analyze nude, sexual, or minor images
- Photos not stored unless user explicitly saves them
- AI results never auto-saved
- Consent screen shown before every body analysis

---

## 9. Exercise Import (Admin Web)

The import system supports provider-agnostic pipelines. Currently implemented:

| Provider ID | Source | License | Exercises |
|-------------|--------|---------|-----------|
| `FREE_EXERCISE_DB` | yuhonas/free-exercise-db (GitHub) | MIT | ~800 |

**To run an import:**
1. Log into admin web at http://localhost:5173
2. Go to **Import** in sidebar
3. Select provider `FREE_EXERCISE_DB`
4. Run **dry-run first** to see preview
5. Uncheck dry-run and run again to actually import

All imported exercises start as `DRAFT`. Review them in **Quality Review** before publishing.

**To add a new provider:** implement `ExerciseImportProvider` interface in:
```
backend/src/main/java/com/btrack/modules/exercise/importer/
```

---

## 10. Database Migrations

All migrations are in:
```
backend/src/main/resources/db/migration/
```

| Migration | What it creates |
|-----------|----------------|
| V1 | users, user_profiles, refresh_tokens |
| V2 | subscriptions, plan_features, free_plan_limits |
| V3 | exercises (25 seeded), custom exercise support |
| V4 | workout_plans, workout_days, workout_day_exercises |
| V5 | nutrition tracking |
| V6 | sleep, water, steps logging |
| V7 | AI usage logs, notifications |
| V8 | AI body fat, nutrition estimate entities |
| V9 | Health additions |
| V10 | Recovery scores, check-ins, recommendations |
| V11 | Admin: exercise_status, exercise_media, exercise_translations, exercise_import_history, exercise_audit_log |
| V12 | Seeds admin@btrack.app / Admin@12345 as SUPER_ADMIN |

Flyway runs all migrations in order on startup. Never edit an existing migration — add a new V{n+1} file instead.

---

## 11. Quick Start (All Three Services)

Open 3 terminal tabs:

**Tab 1 — Backend:**
```bash
cd /Users/ElRouby/Downloads/B-Track/backend
export DB_URL=jdbc:postgresql://localhost:5432/btrack
export DB_USERNAME=btrack
export DB_PASSWORD=btrack
export JWT_SECRET=btrack-super-secret-jwt-key-change-this-in-production-256bit
export OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
mvn spring-boot:run
```

**Tab 2 — Admin Web:**
```bash
cd /Users/ElRouby/Downloads/B-Track/admin-web
npm install     # first time only
npm run dev
# → http://localhost:5173  (login: admin@btrack.app / Admin@12345)
```

**Tab 3 — Mobile (Metro + Simulator):**
```bash
cd /Users/ElRouby/Downloads/B-Track/mobile
npx react-native start --reset-cache
# in another tab:
npx react-native run-ios
```

---

## 12. Production Checklist

Before going live, update these:

- [ ] `JWT_SECRET` — Generate 32+ random bytes: `openssl rand -base64 32`
- [ ] `DB_PASSWORD` — Strong password, not "btrack"
- [ ] Admin password — Change `admin@btrack.app` password after first login
- [ ] `OPENAI_API_KEY` — Set spending limits at https://platform.openai.com/usage
- [ ] Remove `V12__seed_admin_user.sql` BCrypt hash from public repos
- [ ] Set `SPRING_PROFILES_ACTIVE=prod` (disables SQL logging)
- [ ] Configure CORS `allowedOriginPatterns` in `SecurityConfig.java` to actual domains
- [ ] Enable HTTPS (TLS termination via reverse proxy — nginx or Caddy)
- [ ] Set up PostgreSQL backups
- [ ] Configure rate limiting at the gateway level

---

## 13. Common Problems

| Problem | Cause | Fix |
|---------|-------|-----|
| `[Reanimated] Failed to create a worklet` | Babel plugin missing | Check `babel.config.js` — `react-native-reanimated/plugin` must be LAST in plugins |
| `View config not found for component 'FastImageView'` | Old Architecture library | `react-native-fast-image` was removed; use built-in `Image` component |
| Metro cache error after dependency changes | Stale cache | `npx react-native start --reset-cache` |
| Backend fails on startup with Flyway error | Migration checksum mismatch | Never edit existing V*.sql files; only add new ones |
| `401 Unauthorized` on admin endpoints | Role not in JWT | User must have role = 'ADMIN' or 'SUPER_ADMIN' in DB; log out and log back in to refresh token |
| Exercise demo stuck on "Loading demo..." | `display: 'none'` blocks `onLoad` on iOS New Architecture | Use `opacity: 0` instead — already fixed in `ExerciseMediaView.tsx` |
| Admin web shows "Access denied" | User role is USER | Update role in DB and re-login |

---

*Generated: 2026-07-01 · B-Track v1.0*
