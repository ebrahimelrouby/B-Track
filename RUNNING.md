# Running B-Track (Docker backend + Mobile + Admin Web)

Quickest path to a fully running stack: backend + Postgres in Docker, admin
web and mobile run natively against it.

## 1. Backend + Database (Docker)

```bash
cd /Users/ElRouby/Downloads/B-Track/backend
cp .env.example .env
```

Edit `.env` and at minimum set a real `JWT_SECRET` (a long random string).
Everything else (Gemini/Apple/Google/Stripe keys) can stay blank for now —
those features just fail individually with a clear "not configured" error
instead of breaking the app.

```bash
docker compose up -d --build
```

This starts two containers:
- `btrack-postgres` — Postgres 16 on host port `5433`
- `btrack-api` — the Spring Boot API on host port `8080` (Flyway runs all
  migrations automatically)

Check it's up:
```bash
curl http://localhost:8080/actuator/health
# {"status":"UP"}
```

Swagger UI: `http://localhost:8080/swagger-ui.html`

> `docker-compose.yml` only forwards `JWT_SECRET` and DB vars into the `api`
> container — if you want the AI/payment keys active inside Docker too, add
> them to the `api.environment` block in `docker-compose.yml` (or switch to
> `env_file: .env`), then `docker compose up -d --build` again.

To stop: `docker compose down` (add `-v` to also wipe the Postgres volume).

## 2. Admin Web Portal

```bash
cd /Users/ElRouby/Downloads/B-Track/admin-web
npm install
npm run dev
```

Open `http://localhost:5173`. Vite's dev server proxies `/api/**` to
`localhost:8080` automatically, so it talks to the backend container with
zero config. Log in with the seeded account: `admin@btrack.app` /
`Admin@12345`.

## 3. Mobile App

```bash
cd /Users/ElRouby/Downloads/B-Track/mobile
npm install
cd ios && pod install && cd ..   # iOS only, skip for Android
```

`src/constants/config.ts` already points at the right backend for dev
automatically (`localhost:8080` on iOS, `10.0.2.2:8080` on Android emulator).
Physical devices need your machine's LAN IP instead — edit `API_BASE_URL` in
that file if so.

```bash
npm run ios       # iOS Simulator
# or
npm run android    # Android Emulator
```

Register a new account in-app, or reuse the seeded admin account (it also
has an active `PREMIUM_ANNUAL` subscription seeded, useful for testing
premium features without going through IAP).

## Run order

Start the backend (Docker) first — both the admin portal and mobile app need
it reachable before they'll do anything useful. Admin portal and mobile app
can then start in either order.

## See also

- [backend/BACKEND.md](backend/BACKEND.md) — full env var/key reference, API
  endpoint list, payment integration flow
- [mobile/MOBILE.md](mobile/MOBILE.md) — mobile config, what's live vs.
  mock-only, IAP flow
- [admin-web/ADMIN_WEB.md](admin-web/ADMIN_WEB.md) — admin portal auth and
  endpoints used
- `SETUP.md` (repo root) — an older, non-Docker setup guide; predates the
  current payment gateway (Apple/Google/Stripe) and Gemini AI integration,
  so treat this file (`RUNNING.md`) and the three layer docs above as current.
