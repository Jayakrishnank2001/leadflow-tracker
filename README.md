# Leadflow — Lead Tracker

A full-stack Lead Tracker: create leads, update status, search, and list with pagination and live status stats.

**Stack:** React 19 + TypeScript + Vite (frontend) · Node.js + Express + TypeScript + MongoDB/Mongoose (backend)

| | |
|---|---|
| Repository | https://github.com/Jayakrishnank2001/leadflow-tracker |
| Frontend (live) | https://leadflow-tracker-snowy.vercel.app |
| Backend API (live) | https://leadflow-tracker-production.up.railway.app |

## Contents
[Features](#features) · [Architecture](#architecture) · [Data Model](#data-model) · [API Reference](#api-reference) · [Project Structure](#project-structure) · [Setup](#setup-instructions) · [Testing](#testing) · [Deployment](#deployment-steps) · [Git History](#git-history) · [Trade-offs](#trade-offs) · [Future Improvements](#future-improvements)

---

## Features

| Requirement | Status | Where |
|---|---|---|
| Create Lead | ✅ | `POST /api/leads` · `LeadForm.tsx` modal |
| Update Lead Status | ✅ | `PATCH /api/leads/:id/status` · per-row dropdown |
| Search Leads | ✅ | `GET /api/leads?search=` · debounced (500ms) search bar |
| List Leads | ✅ | `GET /api/leads?status=&page=&limit=` · table + pagination + filter |
| Fields: Name, Email, Phone, Status, Created At | ✅ | `lead.model.ts` (`timestamps: true` supplies `createdAt`) |

**Beyond the brief:** delete lead (`DELETE /api/leads/:id`); clickable status-overview cards (Total/New/Contacted/Qualified/Converted, each filters the list); two-layer validation (client + server, per-field error messages); duplicate-email protection (unique index + `409`); loading/empty/error states; responsive layout down to 320px (table becomes a card list on mobile); accessible controls (aria labels, `Escape`/outside-click to close menus).

---

## Architecture

```
React SPA (Vite)  ──HTTPS/JSON──▶  Express REST API  ──Mongoose──▶  MongoDB (Atlas)
```

**Frontend:** `LeadsPage.tsx` owns all state (search, filter, page, dialog) and orchestrates requests through `lead.service.ts` (builds query strings, normalizes `_id`/dates) and `lib/api.ts` (fetch wrapper). Presentational components (`LeadTable`, `SearchBar`, `StatusFilter`, `StatsCards`, `Pagination`, `LeadForm`, `LeadStatusSelect`, `CustomSelect`) are pure and prop-driven.

**Backend:** layered — `routes → controller (validate) → service (Mongoose queries) → model`, with a central error middleware mapping thrown/Mongo errors to `{ message, errors? }`.

**Example — search:** typing debounces 500ms → `GET /api/leads?search=…` → controller validates query → service runs a case-insensitive regex `find()` + `countDocuments()` in parallel → `{ data, pagination }` re-renders the table.

**Example — status update:** dropdown selection → `PATCH /api/leads/:id/status` → enum-validated → `findByIdAndUpdate` (404 if missing) → page refetches list + stats.

---

## Data Model

MongoDB collection `leads` (`backend/src/models/lead.model.ts`):

| Field | Type | Constraints |
|---|---|---|
| `name` | string | required, trimmed |
| `email` | string | required, valid format, lowercased, **unique** |
| `phone` | string | required, `+`/digits/spaces/dashes/parens, 7–15 digits |
| `status` | enum | `New` \| `Contacted` \| `Qualified` \| `Converted`, default `New` |
| `createdAt` / `updatedAt` | date | via Mongoose `timestamps` |

---

## API Reference

Local base URL: `http://localhost:5000`. All bodies are JSON. Error shape: `{ message, errors? }` (`errors` is a `field → message` map).

| Endpoint | Purpose | Success | Errors |
|---|---|---|---|
| `POST /api/leads` | Create a lead | `201` + lead | `400` validation, `409` duplicate email |
| `GET /api/leads?search=&status=&page=&limit=` | List/search/filter/paginate | `200` `{ data, pagination }` | — |
| `PATCH /api/leads/:id/status` | Update status | `200` + lead | `400` invalid id/status, `404` not found |
| `DELETE /api/leads/:id` | Delete a lead | `204` | `400` invalid id, `404` not found |
| `GET /api/health` | Liveness probe | `200` `{ ok: true }` | — |

`limit` defaults to 10 (max 100); results sort by `createdAt` descending.

```bash
# Create
curl -X POST http://localhost:5000/api/leads -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","phone":"+1 555 010 1000"}'

# List / search
curl "http://localhost:5000/api/leads?search=ada&page=1&limit=5"

# Update status
curl -X PATCH http://localhost:5000/api/leads/<id>/status -H "Content-Type: application/json" -d '{"status":"Qualified"}'

# Delete
curl -X DELETE http://localhost:5000/api/leads/<id>
```

**Validation** (`backend/src/validators/lead.validator.ts`, hand-rolled, runs client-side too, returns all field errors at once): name required; email format + uniqueness; phone pattern + 7–15 digit count; status must be a valid enum value; `page` ≥ 1; `limit` 1–100.

---

## Project Structure

```
leadflow-tracker/
├── README.md · AGENT.md
├── backend/src/
│   ├── config/database.ts        # connectDatabase()
│   ├── models/lead.model.ts      # schema
│   ├── validators/lead.validator.ts
│   ├── services/lead.service.ts  # business logic
│   ├── controllers/lead.controller.ts
│   ├── routes/lead.routes.ts
│   ├── middleware/error.middleware.ts
│   ├── app.ts · server.ts
│   └── tests/                    # 47 tests (validators + API, in-memory MongoDB)
└── frontend/src/
    ├── components/                # LeadTable, LeadForm, LeadStatusSelect, CustomSelect,
    │                               # SearchBar, StatusFilter, StatsCards, Pagination, EmptyState
    ├── pages/LeadsPage.tsx        # page state + orchestration
    ├── services/lead.service.ts  # typed API calls, DTO mapping
    ├── lib/api.ts                 # fetch wrapper + ApiError
    ├── types/lead.ts
    └── *.test.ts(x)               # 34 tests, colocated
```

---

## Setup Instructions

**Prerequisites:** Node.js 20+, npm, a MongoDB database (free [Atlas](https://www.mongodb.com/atlas) M0 cluster works — create a cluster + DB user, allow your IP under Network Access, copy the SRV connection string).

**Backend**
```bash
cd backend
npm install
```
Create `backend/.env` (git-ignored):
```dotenv
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/leadflow
PORT=5000            # optional, defaults to 5000
```
```bash
npm run dev     # tsx watch → http://localhost:5000
curl http://localhost:5000/api/health   # {"ok":true}
```
Production: `npm run build` (→ `dist/`) then `npm start`. The server connects to MongoDB before listening and exits (code 1) if the connection fails.

**Frontend**
```bash
cd frontend
npm install
npm run dev     # → http://localhost:5173
```
Optional `frontend/.env` to point at a different API:
```dotenv
VITE_API_URL=https://your-backend-url
```
Production: `npm run build` (type-checks + bundles to `dist/`), `npm run preview` to serve it locally.

**Run both:** two terminals, `backend && npm run dev` / `frontend && npm run dev`, open `http://localhost:5173`.

| Variable | App | Required | Default |
|---|---|---|---|
| `MONGODB_URI` | backend | ✅ | – |
| `PORT` | backend | – | `5000` |
| `VITE_API_URL` | frontend | – | `http://localhost:5000` |

---

## Testing

**Status:** 47 backend tests (Vitest + Supertest, in-memory MongoDB) + 34 frontend tests (Vitest + Testing Library) — all green, plus a type-checked build.

```bash
cd backend  && npx tsc --noEmit && npm test    # validators + full API
cd frontend && npx tsc --noEmit && npm test    # services, form, dropdown, page flows
npm run test:coverage    # v8 coverage, either package
```

| Suite | Covers |
|---|---|
| `backend/tests/lead.validator.test.ts` (25) | Field rules, phone/email format, status enum, pagination bounds |
| `backend/tests/lead.api.test.ts` (22) | Health, create (happy/400/409), list (search/filter/pagination), status update, delete, 404 |
| `frontend/src/lib/api.test.ts` (5) | Fetch wrapper, query building, `ApiError` |
| `frontend/src/services/lead.service.test.ts` (6) | Endpoint params, `_id`→`id`/date mapping |
| `frontend/src/components/LeadForm.test.tsx` (9) | Validation, duplicate-email error, submit/reset |
| `frontend/src/components/CustomSelect.test.tsx` (6) | Open/close, selection, outside-click/Escape |
| `frontend/src/pages/LeadsPage.test.tsx` (8) | List/empty/error states, debounce, create/update/delete flows |

Backend tests need no `.env`/Atlas — each run boots its own `mongodb-memory-server`, so they're CI-safe.

**Manual checklist:** empty/error states on API failure · create (valid + invalid + duplicate email) · search debounce · status filter/card click resets to page 1 · status change updates stats · delete adjusts pagination · dropdown Escape/outside-click · responsive at 768/375/320px.

---

## Deployment Steps

**1. Database (MongoDB Atlas):** create a free M0 cluster + DB user → Network Access allow `0.0.0.0/0` for a demo (restrict later) → copy the SRV URI as `MONGODB_URI`. The unique `email` index is created automatically on first write.

**2. Backend (Render/Railway/Fly.io)** — example (Render):

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Build | `npm install && npm run build` |
| Start | `npm start` |
| Env | `MONGODB_URI=<atlas-uri>` |
| Health check | `/api/health` |

The server won't listen until the DB connects, so a bad URI fails the deploy loudly. `cors()` is open for the demo — for production, restrict via `cors({ origin: process.env.CORS_ORIGIN })`.

**3. Frontend (Vercel/Netlify)** — example (Vercel):

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Framework | Vite |
| Build | `npm run build` |
| Output | `dist` |
| Env | `VITE_API_URL=<backend-url>` |

`VITE_API_URL` is inlined at build time — set it before building, not after. Single-page app, no SPA rewrite rules needed.

**4. Verify:**
```bash
curl https://<backend-url>/api/health
curl "https://<backend-url>/api/leads?limit=5"
```
Then create/update/search/delete a lead in the live UI and check the console for CORS errors.

---

## Git History

Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `style:`) across 12 commits:

1. Initial commit
2. `feat:` lead tracker frontend UI
3. Merge remote initial commit with local frontend work
4. `chore:` Express + TypeScript backend skeleton
5. `feat:` MongoDB connection + Lead model
6. `feat:` create/list/update lead APIs (validators, service, controller, routes)
7. `refactor:` split frontend into reusable components
8. `feat:` integrate frontend with backend APIs + delete endpoint
9. `style:` dropdown/validation/responsive UI refinements
10. `test:` add automated tests for lead management
11. `docs:` update deployment configuration and live URLs
12. `docs:` README + AGENT.md

---

## Trade-offs

- **MongoDB over PostgreSQL** — faster to ship on a flexible schema + Atlas free tier; costs relational guarantees and joins (uniqueness handled via index + `11000` guard instead of a `CHECK` constraint).
- **Hand-rolled validation** instead of Zod/Joi — zero dependencies, full control of the error contract; costs duplicated client/server rules that can drift.
- **Custom dropdown** instead of a headless UI library — exact control of the design; cost a real stacking-context bug (fixed via `createPortal` + fixed positioning) and manual outside-click/Escape handling instead of a library's built-in focus trap/roving tabindex.
- **Regex search**, not a text index — simple, no setup, but doesn't scale; MongoDB text indexes or Atlas Search would be the production answer.
- **Debounce without request cancellation** — a slow earlier response could overwrite a newer one; `AbortController`/React Query would fix ordering.
- **Stats cards fetch `limit=100`** rather than a dedicated aggregation endpoint — simple, but counts cap at 100 leads.
- **No authentication or multi-tenancy** — out of scope per the brief; the largest gap versus a production app.
- **Open CORS** for the demo — needs restricting to the frontend origin for production.

---

## Future Improvements

**Testing:** CI (GitHub Actions) running `tsc --noEmit` + `npm test` + coverage on every push; a Playwright E2E smoke test against the deployed URLs.

**Product:** Kanban pipeline view; lead detail page with notes/activity history; bulk actions; CSV import/export; auth + per-user/team workspaces; optimistic UI updates.

**Engineering:** Zod (or shared OpenAPI schema) to remove duplicated validation; `AbortController`/React Query for cancellation and caching; a `GET /api/leads/stats` aggregation endpoint; text-indexed search with cursor-based pagination at scale; rate limiting, `helmet`, request logging, env-driven `CORS_ORIGIN`; Docker/docker-compose + CI/CD previews; accessibility pass (focus trap, roving tabindex, contrast audit).

---

## Acknowledgements

The initial UI was scaffolded from a v0/shadcn-style template and reworked component-by-component to meet the assignment requirements. See [AGENT.md](./AGENT.md) for the full account of AI tool usage, what was AI-generated vs. hand-written, and key engineering decisions.