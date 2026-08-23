# B-Track Admin Web

Internal exercise-management portal (React + Vite). Not customer-facing —
used by admins to manage the exercise catalog that the mobile app reads.

## Tech stack

- React 18, TypeScript, Vite 5.3.5
- `react-router-dom` v6, `@tanstack/react-query`, `zustand` (auth store)
- `react-hook-form` + `zod`, Radix UI primitives, Tailwind CSS
- Vitest + React Testing Library

## Running locally

```
npm install
npm run dev      # http://localhost:5173
```

The backend must be running on `localhost:8080` — Vite's dev server proxies
`/api/**` there automatically (`vite.config.ts` `server.proxy`), so the app
just calls relative paths like `/api/v1/admin/exercises`.

```
npm test          # vitest run — 10 tests
npm run build      # tsc && vite build
npm run lint
```

## Configuration

**Important:** `.env.example` declares `VITE_API_URL`, but nothing in the
code actually reads it — `src/api/client.ts` hardcodes `baseURL: "/api/v1"`
and relies entirely on the Vite dev proxy (`localhost:8080`) or, in a real
deployment, on the admin app being served from behind the same origin/reverse
proxy as the API. To point this at a different backend, edit `vite.config.ts`'s
proxy target (dev) or your production reverse-proxy config — not an env var.

There are **no API keys required** for this app at all — it has no
payment-related code and makes no third-party calls. Its only dependency is
the backend being reachable and an admin account existing.

## Auth

Login (`/login`) posts to the backend's `POST /auth/login` (same endpoint the
mobile app uses) and rejects locally if the returned `role` isn't `ADMIN` or
`SUPER_ADMIN` — the backend also independently enforces this on every
`/api/v1/admin/**` call, so this is a UX shortcut, not the real security
boundary. Session (`token`, `role`, etc.) is a zustand store persisted to
`localStorage` (`src/auth/authStore.ts`); `PrivateRoute` redirects to
`/login` if `isAuthenticated()` is false.

Default seeded account (from the backend's `V12` migration, **change
immediately outside local dev**): `admin@btrack.app` / `Admin@12345`.

## Architecture

- `src/api/client.ts` — axios instance, attaches `Authorization: Bearer
  <token>` from the auth store, redirects to `/login` on a 401 (except for
  the login call itself).
- `src/api/exercises.ts` — every backend call this app makes.
- `src/auth/` — `authStore.ts` (zustand), `PrivateRoute.tsx`.
- `src/pages/` — one area per route: `Dashboard`, `exercises/` (list, detail,
  create, edit, quality review, bulk edit, duplicate review), `import/`
  (wizard + history), `media/`, `translations/`, `audit/`.
- `src/components/ui/` — Radix-based primitives (button, card, dialog, etc.).

## API endpoints used

All calls go through the axios client to the backend's `/api/v1` — see
[backend/BACKEND.md](../backend/BACKEND.md) for the authoritative list. This
app only ever calls:

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/login` |
| Dashboard | `GET /admin/dashboard/stats` |
| Exercise CRUD | `GET/POST /admin/exercises`, `GET/PUT/DELETE /admin/exercises/{id}`, `PATCH /admin/exercises/{id}/status`, `POST /admin/exercises/bulk-status` |
| Duplicates | `GET /admin/exercises/{id}/duplicates` |
| Media | `GET/POST /admin/exercises/{id}/media`, `DELETE /admin/exercises/{id}/media/{mediaId}` |
| Translations | `GET /admin/exercises/{id}/translations`, `PUT /admin/exercises/{id}/translations/{locale}` |
| Import | `GET /admin/exercises/import/providers`, `POST /admin/exercises/import`, `GET /admin/exercises/import/history`, `GET /admin/exercises/import/{importId}` |
| Audit log | `GET /admin/audit-log`, `GET /admin/exercises/{id}/audit-log` |

Every one of these requires an `ADMIN`/`SUPER_ADMIN` JWT — there is no public
or regular-user surface in this app.
