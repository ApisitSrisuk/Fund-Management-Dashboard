# Fund Management Dashboard

Interview test — Mid-level Frontend Engineer
**Stack:** React 19 + TypeScript (Vite) · NestJS 11 + TypeORM + PostgreSQL 16 · Docker Compose

```
fund-management/
├── backend/            NestJS API  (port 3000, prefix /api)
├── frontend/           React SPA   (Vite dev 5173 / nginx 8080 in Docker)
└── docker-compose.yml  db + backend + frontend
```

---

## How to run

### Option A — Docker (ทั้งระบบ คำสั่งเดียว)

```bash
docker compose up -d --build
```

| Service  | URL                          |
|----------|------------------------------|
| Web      | http://localhost:8080        |
| API      | http://localhost:3000/api    |
| Postgres | localhost:5432 (fund / fund) |

ตอน backend start ครั้งแรก ระบบจะสร้างตารางอัตโนมัติ และ seed นโยบาย 3 แบบกับลูกค้า 2 คน

ถ้าต้องการล้างข้อมูลทั้งหมด: `docker compose down -v`

### Option B — Local dev (ไม่ต้องใช้ Docker)

ต้องมีแค่ Node 20+ เท่านั้น ส่วน `npm run db:local` จะรัน PostgreSQL ตัวจริงจาก `node_modules` (แพ็กเกจ `embedded-postgres`) บน port **5433** และเก็บข้อมูลไว้ใน `backend/.local-pg/` ถ้าต้องการรีเซ็ตข้อมูลให้ลบโฟลเดอร์นี้

```bash
# terminal 1 — database
cd backend
cp .env.example .env       # ค่า default ชี้ไปที่ DB local บน port 5433
npm install
npm run db:local

# terminal 2 — backend
cd backend
npm run start:dev          # http://localhost:3000/api

# frontend (อีก terminal)
cd frontend
npm install
npm run dev                # http://localhost:5173  (proxy /api → :3000)
```

> ถ้ามีโปรแกรมอื่นใช้ port 3000 อยู่ ให้ตั้ง `PORT=3001` ใน `backend/.env` แล้วรัน frontend ด้วย
> `API_PROXY_TARGET=http://localhost:3001 npm run dev`
>
> ถ้าจะใช้ PostgreSQL ที่ติดตั้งในเครื่องอยู่แล้ว ให้แก้ค่า `DB_*` ใน `backend/.env` แทนการรัน `db:local`

### Tests

```bash
cd backend  && npm test     # Jest: duplicate-order rule, cancel rule, status workflow
cd frontend && npm test     # Vitest: HTTP error → message mapping
cd frontend && npm run lint # ESLint ที่ตั้ง @typescript-eslint/no-explicit-any เป็น error
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable         | Default           | Description                                              |
|------------------|-------------------|----------------------------------------------------------|
| `PORT`           | `3000`            | HTTP port                                                |
| `DB_HOST`        | `localhost`       | Postgres host (`db` ใน Docker)                           |
| `DB_PORT`        | `5432`            |                                                          |
| `DB_USER`        | `fund`            |                                                          |
| `DB_PASSWORD`    | `fund`            |                                                          |
| `DB_NAME`        | `fund_management` |                                                          |
| `DB_SYNCHRONIZE` | `true`            | ให้ TypeORM สร้าง/อัปเดต schema เอง (ใช้เพื่อเดโมเท่านั้น) |
| `SEED_ON_BOOT`   | `true`            | seed ข้อมูลอ้างอิงตอนตารางยังว่าง                        |
| `CORS_ORIGIN`    | allow all         | รายการ origin คั่นด้วย comma                              |

### Frontend

| Variable            | Default | Description                                          |
|---------------------|---------|------------------------------------------------------|
| `VITE_API_BASE_URL` | `/api`  | base URL ของ API (ใส่ตอน build)                       |
| `API_PROXY_TARGET`  | `http://localhost:3000` | ปลายทาง proxy ของ Vite dev server     |

### docker-compose (ไม่บังคับ)

`DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT_HOST`, `API_PORT_HOST`, `WEB_PORT_HOST`

---

## API design

ทุก route อยู่ใต้ `/api` และ error body ใช้รูปแบบมาตรฐานของ NestJS: `{ statusCode, message, error }`
error ทาง business จะมี `code` ที่ machine อ่านได้แนบมาด้วย

| Method | Path                         | Success | Errors                    | Notes |
|--------|------------------------------|---------|---------------------------|-------|
| GET    | `/customers`                 | 200     |                           | ใช้แทนระบบ auth (ดู What's missing) |
| GET    | `/policies`                  | 200     |                           | รวม `allocations` (สัดส่วนหุ้น) |
| GET    | `/policies/:id`              | 200     | 400 uuid ไม่ถูกต้อง, 404  | |
| GET    | `/portfolios?customerId=`    | 200     | 400, 404 ไม่พบลูกค้า      | แต่ละรายการมี `policy` + `latestOrder` |
| GET    | `/portfolios/:id`            | 200     | 400, 404                  | |
| POST   | `/portfolios`                | 201     | 400, 404 ไม่พบลูกค้า/นโยบาย | body `{ customerId, policyId, name? }` |
| GET    | `/orders?customerId=&portfolioId=&status=` | 200 | 400 | filter ได้ทุกตัว (ไม่บังคับ) |
| GET    | `/orders/:id`                | 200     | 400, 404                  | |
| POST   | `/orders`                    | 201     | 400, 404, **409 `ACTIVE_ORDER_EXISTS`** | body `{ portfolioId, amount }` |
| POST   | `/orders/:id/cancel`         | 200     | 404, **409 `INVALID_STATUS_TRANSITION`** | ยกเลิกได้เฉพาะ PENDING |
| PATCH  | `/orders/:id/status`         | 200     | 400, 404, 409             | body `{ status: PROCESSING \| COMPLETED \| FAILED }` |
| GET    | `/health`                    | 200     |                           | ใช้กับ healthcheck ของ Docker |

### เหตุผลในการออกแบบ endpoint

- **Resource-oriented และแบนราบ** (`/portfolios?customerId=` แทน `/customers/:id/portfolios`) — ฝั่ง frontend ใช้ client function ตัวเดียวต่อ resource ได้ และเพิ่ม filter ภายหลังได้โดยไม่ต้องเพิ่ม route
- **การยกเลิกเป็น command endpoint (`POST /orders/:id/cancel`)** ไม่ใช่ `PATCH status=CANCELLED` — เพราะการยกเลิกเป็น action ของลูกค้า และมีกฎเฉพาะของมันเอง ส่วน `PATCH /status` เป็นช่องทางของฝั่ง processing (ในระบบจริงต้องมี auth แยก) การแยก endpoint ทำให้ตั้ง permission แยกกันได้ในอนาคต
- **409 Conflict สำหรับการละเมิดกฎ business** — request นั้นถูกต้องตาม syntax (ไม่ใช่ 400) แต่ขัดกับ state ปัจจุบันของ resource ส่วน 400 ใช้กับ input ที่ผิดรูปแบบเท่านั้น
- **ส่ง `latestOrder` มากับข้อมูล portfolio** — หน้า Portfolio ต้องการ field นี้ จึงดึงมาด้วย query `DISTINCT ON` ครั้งเดียว แทนที่จะให้ frontend ยิง request ทีละ portfolio (ปัญหา N+1)
- **มี `code` ใน error body** (`ACTIVE_ORDER_EXISTS`, `INVALID_STATUS_TRANSITION`) — frontend ตัดสินใจจาก status/code ไม่ต้องไป parse ข้อความภาษาอังกฤษ

---

## Design decisions

### Backend — วิธีบังคับ business rules

| Rule | วิธีบังคับ |
|------|-----------|
| 1 portfolio ผูกกับ 1 นโยบาย | `portfolios.policy_id` เป็น FK แบบ `NOT NULL` คอลัมน์เดียว (ไม่มี join table) และไม่มี endpoint สำหรับเปลี่ยนนโยบายหลังสร้าง |
| ห้ามสร้าง order ใหม่ถ้ายังมี PENDING/PROCESSING อยู่ | ป้องกัน **2 ชั้น**: (1) ใน transaction จะ lock แถว portfolio ด้วย `SELECT … FOR UPDATE` แล้วเช็กว่ามี active order หรือไม่ → ตอบ 409 พร้อมข้อความที่ชัดเจน (2) มี **partial unique index** `UNIQUE (portfolio_id) WHERE status IN ('PENDING','PROCESSING')` เพื่อให้ DB การันตีกฎแม้มี request เข้ามาพร้อมกัน และ error unique-violation จะถูกแปลงเป็น 409 เช่นกัน |
| ยกเลิกได้เฉพาะ PENDING | ใช้ state machine เดียวกัน: transition `PENDING → CANCELLED` เป็นเส้นทางเดียวที่ไปถึง CANCELLED ได้ |
| PENDING → PROCESSING → COMPLETED / FAILED | ตาราง `ORDER_STATUS_TRANSITIONS` ใน `order-status.ts` แถว order ถูก lock ระหว่างเปลี่ยนสถานะ และ transition ที่ไม่อนุญาต (เช่นข้าม PROCESSING) จะได้ 409 |

เพิ่มสถานะ `CANCELLED` เข้าไปใน workflow เพราะการยกเลิกต้องมี terminal state ที่แยกออกจาก `FAILED`

ใช้ `ValidationPipe` แบบ `whitelist + forbidNonWhitelisted` — field ที่ไม่รู้จักจะได้ 400 แทนที่จะถูกตัดทิ้งเงียบ ๆ ส่วน `amount` ต้องเป็นค่าบวก ทศนิยมไม่เกิน 2 ตำแหน่ง และเก็บเป็น `NUMERIC(18,2)`

### Frontend

- **TanStack Query** ใช้จัดการ server state ทั้งหมด แต่ละ resource มี hook ของตัวเองใน `src/hooks/` (`usePolicies`, `usePortfolios`, `useOrders`, `useCustomers`) และ component จะไม่เรียก `fetch` ตรง ๆ ทุก query/mutation มี `isPending`/`error` ซึ่งแต่ละหน้าแสดงผลออกมา (`Spinner`, `ErrorState` พร้อมปุ่มลองใหม่, `InlineError`)
- **`ApiError`** (`src/api/client.ts`) เก็บ HTTP status, `kind` (`bad-request | not-found | conflict | server | network`) และ error body ที่ type ไว้แล้ว ส่วน `getErrorMessage()` แปลงเป็นข้อความภาษาไทย โดยแต่ละหน้าใส่ข้อความเฉพาะสำหรับ 409/404 ได้ เช่นหน้า Order จะอธิบายว่า order *ไหน* ที่ขวางการสร้างอยู่
- **ไม่ retry error 4xx** — `retry` ของ query ตั้งให้ลองใหม่เฉพาะ network/5xx เพราะ 404 ลองกี่ครั้งก็ไม่หาย
- **Invalidate อย่างถูกจุด** — mutation ของ order จะ invalidate ทั้ง `orders` และ `portfolios` (เพราะ status ของ order ล่าสุดแสดงอยู่ในหน้า Portfolio) และ invalidate *แม้ตอน error* ด้วย เพราะ 409 จากการยกเลิกแปลว่ารายการในหน้าจอเก่าไปแล้ว
- **Polling เฉพาะเมื่อจำเป็น** — รายการ order จะ refetch ทุก 5 วินาทีเฉพาะตอนที่ยังมี order ที่เป็น PENDING/PROCESSING อยู่
- **ไม่ disable ปุ่มสร้าง order ล่วงหน้า** ตอนเลือก portfolio ที่มี active order อยู่ — UI จะแสดงคำเตือน แต่ยังให้ส่งได้ เพื่อให้ server เป็นผู้ตัดสินตัวจริง (UI อาจแสดงข้อมูลเก่า) และข้อความ 409 แสดงผลได้ถูกต้อง
- **ห้ามใช้ `any`** — `strict` + `noImplicitAny` + `noUncheckedIndexedAccess` และ ESLint ตั้ง `@typescript-eslint/no-explicit-any: error` ไว้ type ทั้งหมดอยู่ใน `src/types/`
- **"ลูกค้าปัจจุบัน"** เลือกจาก dropdown ที่ header (จำค่าไว้ใน `localStorage`) เพราะ auth อยู่นอก scope ของโจทย์
- **โหมดจำลองระบบหลังบ้าน** (checkbox ในหน้า Order) จะแสดงปุ่ม `→ PROCESSING / COMPLETED / FAILED` ที่เรียก `PATCH /orders/:id/status` เพื่อให้ผู้ตรวจเดิน workflow ครบได้โดยไม่ต้องใช้ curl
- Modal ใช้ `<dialog>` ของ browser (มี focus trap, ปิดด้วย Esc และมี backdrop ให้ในตัว) UI รองรับ light/dark และมือถือ

### Structure

```
backend/src/
  orders/        order.entity (partial unique index), order-status (state machine),
                 orders.service (rules), orders.service.spec.ts (unit tests)
  portfolios/    portfolio.entity (1 policy FK), latestOrder via DISTINCT ON
  policies/      policy + policy_allocations
  customers/
  seed/          idempotent demo seed
frontend/src/
  api/client.ts  fetch wrapper + ApiError
  hooks/         usePolicies · usePortfolios · useOrders · useCustomers · queryKeys
  types/         policy · portfolio · order · customer · api
  pages/         PoliciesPage · PolicyDetailPage · portfolios/* · orders/*
  components/    Layout · Modal · AllocationBar · StatusBadge · Feedback
```

---

## What's missing / ถ้ามีเวลามากกว่านี้

- **Migrations** — ตอนนี้ใช้ `synchronize: true` เพื่อความสะดวก ถ้าใช้งานจริงควรสร้าง TypeORM migrations (โดยเฉพาะ partial unique index) และปิด synchronize
- **Authentication / authorization** — ตอนนี้ระบุลูกค้าผ่าน query param ควรเปลี่ยนเป็น JWT และ `PATCH /orders/:id/status` ควรจำกัดให้เฉพาะ service/admin role
- **ตัวประมวลผล order จริง** — ตอนนี้ status เปลี่ยนด้วยมือ (โหมดจำลอง) ควรมี queue/worker (เช่น BullMQ) ที่พา order เดินไปตาม workflow
- **Idempotency key** ของ `POST /orders` — เพื่อให้ double-submit หรือการ retry จาก network ไม่ไปชนกฎ 409
- **E2E / integration tests** กับ Postgres จริง (Testcontainers) เพื่อพิสูจน์ partial index ภายใต้ concurrency และ component test ฝั่ง frontend (React Testing Library + MSW)
- **Pagination** ของ `GET /orders`
- **ความแม่นยำของจำนวนเงิน** — `NUMERIC` ถูกแปลงเป็น JS `number` ซึ่งพอสำหรับ 2 ตำแหน่ง/≤1e9 ถ้าเป็นระบบเงินจริงควรส่งเป็น string ทศนิยม
- **API docs** — ใส่ Swagger (`@nestjs/swagger`)
- **Admin CRUD สำหรับนโยบาย** (รวมถึงการ validate ว่าสัดส่วนรวมกันได้ 100%) — ตอนนี้มีแค่ข้อมูล seed
