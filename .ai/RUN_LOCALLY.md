# Running Beitoon Locally  -  the complete runbook

> Battle-tested recipe + every gotcha we've hit. If something breaks, jump to **Troubleshooting** at the bottom  -  9/10 issues are one of those five.

---

## 0. Prerequisites
- **Node.js ≥ 20**
- **pnpm ≥ 9.15** (`npm i -g pnpm`)
- **Docker Desktop** (Postgres + PostGIS, Redis, Meilisearch run in containers)

---

## 1. One-time setup
```bash
cd /Users/kareemali/Desktop/Beitoon
pnpm install                 # install all workspace deps
docker compose up -d         # postgres(5433) · redis(6379) · meilisearch(7700)
pnpm db:migrate              # create the schema
pnpm db:seed                 # 12 users · 7 properties
```

Create the web app env so the UI talks to the real API (already done):
```
apps/web/.env
  VITE_USE_API=true
  VITE_API_URL=http://localhost:3001/api/v1
```
> Without this file the web app runs on a **localStorage mock** (no backend). With it, the UI reads/writes the live API.

**Optional  -  Google Maps (interactive pin on the listing wizard):**
```
apps/web/.env
  VITE_GOOGLE_MAPS_API_KEY=your_maps_js_api_key
```
> Read-only map **views** (property page) use a keyless Google embed and need no key. The listing wizard's location **picker** becomes a fully interactive drag-the-pin map when the key is set; without it, it falls back to a keyless embed + "موقعي الحالي" (GPS). Get a key from Google Cloud → Maps JavaScript API.

---

## 2. Every-day run
Two terminal tabs:
```bash
pnpm api     # tab 1 → NestJS on :3001  (Swagger at /api/docs)
pnpm web     # tab 2 → web on :8080
```
Or both at once: `pnpm dev`. Then open **http://localhost:8080**.

---

## 3. Log in
| Phone | OTP | Who |
|---|---|---|
| `+201000000000` | `123456` | **Admin** ("فريق بيتون") → can open `/admin` |
| any other phone | `123456` | regular user |

The dev OTP is **always `123456`**. Admin portal: **http://localhost:8080/admin** (type the URL; only `isAdmin` users get in).

---

## 4. Service URLs
| Service | URL | Notes |
|---|---|---|
| Web | http://localhost:8080 | Vite jumps to **8081** if 8080 is taken |
| API | http://localhost:3001/api/v1 | |
| Swagger | http://localhost:3001/api/docs | full endpoint explorer |
| Readiness | http://localhost:3001/api/v1/health/ready | `db:up, redis:up` |
| Prisma Studio | http://localhost:5555 | `pnpm db:studio` |
| Meilisearch | http://localhost:7700 | key `beitco_master_key_dev` |

---

## 5. Seeing the database
- **Visual:** `pnpm db:studio` → http://localhost:5555
- **psql:** `docker exec -it beitco-postgres psql -U beitco -d beitco_dev`
- **GUI (TablePlus/DBeaver):** host `localhost`, **port 5433**, user `beitco`, pass `beitco_dev`, db `beitco_dev`

## 6. Seeing the OTP
The code lives in **Redis** (not Postgres), 5-min TTL. Get it 3 ways:
- it's always **`123456`** in dev
- API returns it: `curl -s -X POST :3001/api/v1/auth/otp/send -d '{"phone":"+201..."}' -H 'Content-Type: application/json'`
- from Redis: `docker exec beitco-redis redis-cli GET "otp:+201000000000"`

---

## 7. Reset / stop
```bash
docker compose stop                 # stop services (keep data)
docker compose down                 # stop + remove containers (keep data)
docker compose down -v && docker compose up -d && pnpm db:migrate && pnpm db:seed   # full DB reset
```

---

## ⚠️ Troubleshooting (the five usual suspects)

1. **`EADDRINUSE :3001`**  -  an API is already running. `lsof -ti:3001 | xargs kill -9` then `pnpm api`.
2. **"CORS error" in the browser**  -  usually the **API is down**, not real CORS. Check `curl -s :3001/api/v1/health/ready`; start `pnpm api`. (Dev CORS already allows any localhost port.)
3. **"role beitco does not exist"**  -  you hit the **native Postgres on 5432**. The seeded DB is the **Docker one on 5433**. `apps/api/.env` already points at 5433; don't override `DATABASE_URL`.
4. **Web opened on 8081, not 8080**  -  port 8080 was taken by another app/container. Fine to use 8081, or free 8080 (`docker stop <that-container>`).
5. **"None of the selected packages has a … script"**  -  root scripts: `api`→`dev`, `db:*` use `exec`. Or run direct: `cd apps/api && pnpm dev`.

Harmless: `Meilisearch unavailable; using the DB fallback` (search still works) · `package.json#prisma deprecated` (Prisma 7 nudge).
