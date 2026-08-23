# B-Track Backend

Spring Boot 3.2.5 / Java 21 REST API for the B-Track fitness app. Serves the
mobile app (React Native) and the admin web portal (React) from one codebase.

## Tech stack

- Java 21, Spring Boot 3.2.5 (Web, Security, Data JPA, Validation, Mail)
- PostgreSQL 16, Flyway migrations (`src/main/resources/db/migration`, currently V1–V17)
- JWT auth (`jjwt` 0.12.5), BCrypt passwords
- Stripe Java SDK 29.3.0, Apple App Store Server API, Google Play Developer API
- Google Gemini for AI food/body estimation
- springdoc-openapi (Swagger UI at `/swagger-ui.html`)

## Running locally

1. **Database** — either:
   - `docker compose up -d postgres` (maps host `5433` → container `5432`), or
   - any local Postgres 16 reachable at the `DB_URL` below.
2. **Config** — copy `.env.example` to `.env` and fill in what you need (see
   [Environment variables](#environment-variables) below). Source it before
   running, e.g. `set -a && source .env && set +a`.
3. **Run**:
   ```
   mvn spring-boot:run
   ```
   Flyway runs all migrations automatically on startup. The API listens on
   `PORT` (default `8080`), all routes under `/api/v1`.
4. **Swagger UI**: `http://localhost:8080/swagger-ui.html`
5. **Health check**: `GET /actuator/health` (public, no auth).

### JDK note

If your machine's default `java`/`mvn` resolves to JDK 24, Mockito's inline
mock maker breaks (`Mockito cannot mock this class`) — this project targets
Java 21. Point `JAVA_HOME` at a JDK 21 install when building/testing, e.g.:
```
JAVA_HOME=/path/to/jdk-21 mvn test
```

### Tests

```
mvn test
```
75 tests: unit tests (Mockito) for services/verifiers, plus one
`@SpringBootTest` + Testcontainers integration test for the Stripe webhook
(spins up a real Postgres container and runs real Flyway migrations — needs
Docker running).

## Environment variables

All config lives under `${ENV_VAR:default}` placeholders in
`application.yml`, so the app boots fine with nothing configured — features
whose keys are blank fail loudly and specifically when actually invoked
(e.g. "Apple payments are not configured yet."), not silently.

### Core (required to run at all)

| Variable | Default | Notes |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/btrack` | |
| `DB_USERNAME` / `DB_PASSWORD` | `btrack` / `btrack` | |
| `JWT_SECRET` | dev placeholder | **Must** be a real random ≥256-bit secret in production. Signs both access and refresh tokens. |
| `JWT_ACCESS_EXPIRY` / `JWT_REFRESH_EXPIRY` | `900` / `2592000` (seconds) | 15 min / 30 days |
| `PORT` | `8080` | |

### AI food/body estimation (`btrack.ai`)

| Variable | Notes |
|---|---|
| `AI_PROVIDER` | `gemini` (default) or `openai` |
| `GEMINI_API_KEY` | From [Google AI Studio](https://aistudio.google.com/apikey). Used for both text and vision (photo) estimation via `gemini-flash-latest`. |
| `OPENAI_API_KEY` | Only needed if `AI_PROVIDER=openai`. |

Without a key, `AiNutritionController`/`AiBodyFatController` calls fail with a
clear provider error — the rest of the app is unaffected.

### Payments (`btrack.payments`) — see [Payment integration](#payment-integration-flow)

| Variable | Where to get it |
|---|---|
| `APPLE_IAP_KEY_ID` | App Store Connect → Users and Access → Integrations → In-App Purchase → key ID |
| `APPLE_IAP_ISSUER_ID` | Same page, "Issuer ID" at the top |
| `APPLE_IAP_BUNDLE_ID` | Your app's bundle ID (must match the mobile app's `ios/*/Info.plist`) |
| `APPLE_IAP_PRIVATE_KEY` | Full contents of the downloaded `.p8` key file (PEM text, not a path) |
| `APPLE_IAP_SANDBOX` | `true` for TestFlight/sandbox, `false` for production App Store |
| `GOOGLE_PLAY_PACKAGE_NAME` | Your app's Android package name |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Full JSON contents (not a path) of a service account key from Play Console → Setup → API access, granted access to the app |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → your endpoint → "Signing secret" |
| `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_ANNUAL` | Stripe Dashboard → Product catalog → your product's recurring Price IDs |
| `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` | Where Stripe Checkout redirects after payment (no storefront yet — these are placeholder URLs) |

Any of these left blank makes that specific payment path fail with a clear
"not configured yet" error rather than silently misbehaving; the other two
payment paths keep working.

### Other (optional)

| Variable | Purpose |
|---|---|
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` / `MAIL_FROM` | Password-reset emails. Blank = `forgot-password` silently no-ops. |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | SMS (Twilio trial account can only send to verified numbers). |

## Architecture

Modular monolith under `src/main/java/com/btrack/modules/`, one package per
domain: `auth`, `user`, `subscription` (+ `subscription.verification` for
Apple/Google, `subscription.stripe` for Stripe), `exercise`, `workout`,
`session`, `nutrition`, `water`, `sleep`, `steps`, `measurements`,
`recovery`, `ai.nutrition`, `ai.body`. Each module follows
`controller/ service/ repository/ entity/ dto/`.

- **Auth**: JWT access + refresh tokens, `BCryptPasswordEncoder` (cost 12),
  role-based (`USER`, `ADMIN`, `SUPER_ADMIN`) via Spring Method Security.
- **DB**: Flyway is the single source of truth for schema (`ddl-auto: none`).
  Add new migrations as `V{n}__description.sql`, never edit an already-applied one.
- **Errors**: `BTrackException` + `ErrorCode` give every failure a stable
  machine-readable code (`common/exception/`), returned via
  `ApiResponse.error(...)`.
- **Outbound HTTP**: everything (Gemini, Apple, Google) uses Spring's
  `RestClient`, built per-integration in a `@Configuration` class
  (`GeminiConfig`, `AppleConfig`, `GoogleConfig`).

## Authorization model

| Route pattern | Access |
|---|---|
| `POST /api/v1/auth/**` | Public |
| `GET /api/v1/exercises/**` | Public (read-only catalog) |
| `POST /api/v1/subscriptions/stripe/webhook` | Public — authenticated via `Stripe-Signature` header instead of JWT |
| `/api/v1/admin/**` | `ADMIN` or `SUPER_ADMIN` role only |
| Everything else | Any authenticated user (valid JWT) |

Default seeded account (migration `V12`, **change immediately in any
non-local environment**): `admin@btrack.app` / `Admin@12345`, role `SUPER_ADMIN`.

## API reference

All paths are prefixed `/api/v1`. 🔒 = requires JWT. 🔒👑 = requires
`ADMIN`/`SUPER_ADMIN`. 🌐 = public.

### Auth (`/auth`)
| Method | Path | Auth |
|---|---|---|
| POST | `/register` | 🌐 |
| POST | `/login` | 🌐 |
| POST | `/refresh` | 🌐 |
| POST | `/logout` | 🔒 |
| POST | `/forgot-password` | 🌐 |
| POST | `/reset-password` | 🌐 |

### Users (`/users`)
| Method | Path | Auth |
|---|---|---|
| GET | `/me` | 🔒 |
| PATCH | `/me` | 🔒 |

### Subscriptions (`/subscriptions`)
| Method | Path | Auth |
|---|---|---|
| GET | `/entitlements` | 🔒 |
| POST | `/verify` | 🔒 — server-side Apple/Google receipt verification |
| POST | `/stripe/checkout` | 🔒 — creates a Stripe Checkout session, returns hosted URL |
| POST | `/stripe/webhook` | 🌐 (Stripe-Signature verified) |

### Exercises (`/exercises`, `/admin`)
| Method | Path | Auth |
|---|---|---|
| GET | `/exercises` | 🌐 |
| POST | `/exercises` | 🔒 |
| GET | `/admin/dashboard/stats` | 🔒👑 |
| GET/POST | `/admin/exercises`, `/admin/exercises/{id}` | 🔒👑 |
| PUT | `/admin/exercises/{id}` | 🔒👑 |
| PATCH | `/admin/exercises/{id}/status` | 🔒👑 |
| POST | `/admin/exercises/bulk-status` | 🔒👑 |
| DELETE | `/admin/exercises/{id}` | 🔒👑 |
| GET/POST/DELETE | `/admin/exercises/{id}/media[/{mediaId}]` | 🔒👑 |
| GET/PUT | `/admin/exercises/{id}/translations[/{locale}]` | 🔒👑 |
| GET | `/admin/exercises/{id}/duplicates` | 🔒👑 |
| GET | `/admin/exercises/import/providers` | 🔒👑 |
| POST | `/admin/exercises/import` | 🔒👑 |
| GET | `/admin/exercises/import/history`, `/admin/exercises/import/{importId}` | 🔒👑 |
| GET | `/admin/audit-log`, `/admin/exercises/{id}/audit-log` | 🔒👑 |

### Workouts (`/workout-plans`, `/sessions`)
| Method | Path | Auth |
|---|---|---|
| GET/POST | `/workout-plans` | 🔒 |
| GET/DELETE | `/workout-plans/{planId}` | 🔒 |
| POST | `/workout-plans/{planId}/days` | 🔒 |
| POST | `/workout-plans/days/{dayId}/exercises` | 🔒 |
| PATCH/DELETE | `/workout-plans/days/{dayId}` | 🔒 |
| POST | `/sessions/start`, `/sessions/{id}/finish`, `/sessions/sync` | 🔒 |
| GET | `/sessions/history`, `/sessions/{id}`, `/sessions/exercises/{id}/last-sets` | 🔒 |

### Nutrition (`/nutrition`)
| Method | Path | Auth |
|---|---|---|
| GET | `/foods/search`, `/foods/{id}` | 🔒 |
| GET/POST/DELETE | `/diary/{date}`, `/diary`, `/diary/{date}/{entryId}` | 🔒 |
| GET | `/diary/weekly` | 🔒 |

> Backend-complete but **not yet called by the mobile app** — see
> [mobile/MOBILE.md](../mobile/MOBILE.md) for the current mock-only status.

### Water, Sleep, Steps, Measurements, Recovery
| Method | Path | Auth |
|---|---|---|
| GET/POST | `/water/{date}` | 🔒 |
| GET/POST/DELETE | `/health/sleep/today`, `/history`, POST root, `/health/sleep/{id}` | 🔒 |
| GET/POST | `/health/steps/today`, `/history`, POST root | 🔒 |
| POST/GET | `/measurements/weight`, `/weight/history`, `/weight` | 🔒 |
| GET | `/recovery/today`, `/{date}`, `/history`, `/recommendations` | 🔒 |
| POST | `/recovery/recalculate` | 🔒 |
| GET/POST/PUT | `/recovery/check-in/today`, `/check-in`, `/check-in/{id}` | 🔒 |

### AI (`/ai`)
| Method | Path | Auth |
|---|---|---|
| POST | `/ai/nutrition/text`, `/ai/nutrition/photo` (multipart) | 🔒 |
| PUT | `/ai/nutrition/{estimateId}/save` | 🔒 |
| GET/DELETE | `/ai/nutrition/history`, `/ai/nutrition/{estimateId}` | 🔒 |
| POST | `/ai/body-fat/analyze` (multipart) | 🔒 |
| PUT/GET/DELETE | `/ai/body-fat/{estimateId}/save`, `/history`, `/{estimateId}` | 🔒 |

## Payment integration flow

Three independent paths write to the same `subscriptions` table
(`platform` = `IOS` / `ANDROID` / `WEB`). **The server never trusts
client-submitted plan/expiry/transaction data** — it only persists what
Apple/Google/Stripe's own servers confirm.

**iOS / Android (native IAP)**
1. Mobile completes a purchase via `react-native-iap`.
2. Mobile calls `POST /subscriptions/verify` with the platform + raw
   receipt (`receiptData` for iOS) or `purchaseToken` (Android).
3. Backend calls Apple's App Store Server API (`AppleReceiptVerifier`) or
   Google's Play Developer API `subscriptionsv2` (`GooglePlayVerifier`) —
   these are the only source of truth for product/plan/expiry/auto-renew.
4. Backend also rejects the purchase if its `originalTransactionId`
   (Apple) or `purchaseToken` (Android) is already linked to a *different*
   account — prevents one purchase granting premium to multiple accounts.
5. `subscriptions` row updated; response includes fresh entitlements.

**Web (Stripe)**
1. `POST /subscriptions/stripe/checkout` → returns a hosted Stripe
   Checkout URL (backend-only integration — no storefront yet, the link is
   used directly).
2. Stripe sends `checkout.session.completed`, then
   `customer.subscription.updated`/`deleted` webhooks to
   `POST /subscriptions/stripe/webhook`.
3. Each webhook is claimed atomically (`INSERT ... ON CONFLICT DO
   NOTHING` on `processed_webhook_events`) before its handler runs, so
   Stripe's at-least-once redelivery can't double-apply an event or race.
4. `customer.subscription.updated` corrects `plan` from the actual Stripe
   price ID (`checkout.session.completed` only knows "not free" and
   defaults to monthly until this event confirms which price was paid).

## Known gaps

- Mail/SMS (password reset, notifications) silently no-op with no
  credentials configured — fine for local dev, must be set for anything
  user-facing.
- `nutrition`/`water` REST endpoints exist and are fully implemented but
  the mobile app doesn't call them yet (still using local mock data) — see
  mobile docs.
