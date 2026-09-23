# AGENT.md

## AI-Assisted Development

This project was developed using AI-assisted development tools. AI was used as a pair-programming assistant for implementation, refactoring, testing, debugging, and documentation.

The developer remained responsible for defining requirements, selecting the architecture and technology stack, reviewing every AI-generated change, testing the application, and making final engineering decisions.

**Live URLs:** [Frontend](https://leadflow-tracker-snowy.vercel.app) · [Backend](https://leadflow-tracker-production.up.railway.app)

---

## 1. AI Tools Used

| Tool | Model | Purpose |
|---|---|---|
| **Cline** (VS Code extension) | **Claude Sonnet 4.5** | Primary coding assistant — implementation, refactoring, testing, debugging, documentation |
| **v0** | — | Initial UI design and layout setup, adapted as requirements were implemented |

Cline was used in both planning and implementation workflows: plan mode for exploring the repo and proposing a step-by-step approach, act mode for making the approved changes. Every generated change was reviewed and tested — by running the type-checker, the production build, the test suite, and live HTTP calls — before being accepted. Cline was explicitly instructed never to touch Git history; all commits were authored and pushed by the developer.

---

## 2. Prompt Log

Prompts are listed in the order they were used, paraphrased for brevity. Each one targeted a specific requirement, an observed defect, or a review pass.

| # | Prompt (paraphrased) | Result |
|---|---|---|
| 1 | "Remove any static data from the frontend — we'll fetch it from the backend later." | Removed hard-coded demo leads and local mock mutations; page became prop-driven with an empty default state. |
| 2 | "Set up the backend using Node.js, Express, TypeScript, and MongoDB with a clean layered architecture." | Scaffolded `app.ts`/`server.ts`, config, and the routes → controller → service → model structure. |
| 3 | "Add the MongoDB Lead model; the URI is already in `.env`." | `config/database.ts` (guarded connect) and `models/lead.model.ts` (enum status, unique email, timestamps). |
| 4 | "Implement create, list (search, pagination), and status-update APIs — don't connect to React yet." | Validators → service → controller → routes → error middleware, verified with live HTTP calls. |
| 5 | "Split the frontend — `App.tsx` is too large. Organise it into reusable components." | Broke the monolith into a page, 9 components (table, form, search, filter, pagination, etc.), a service layer, and shared types. |
| 6 | "Integrate the frontend with the backend, and add a delete API." | `DELETE /api/leads/:id` added end to end; UI wired to real list/search/pagination/status/create/delete with loading/empty/error states. |
| 7 | "Add debounced search plus phone/email validation; handle duplicate emails with proper API errors." | Debounced search, phone pattern + digit-count rule, unique-email enforcement (409 + unique index), per-field error rendering in the form. |
| 8 | "UI tweaks: clickable stats card, fix dropdown overlap, close dropdowns on outside click." | Card made clickable; outside-click/Escape handling added. Introduced a regression, fixed in the next prompt (§5.1). |
| 9 | "Dropdowns don't open at all now — fix it." | Root-caused and removed the regression from prompt 8. |
| 10 | "Dropdown options still render under other buttons; unify button sizing; remove outer border." | Restyled status pills; fixed the real stacking-context bug with a portaled menu (§5.2). |
| 11 | "Buttons look right, but I still can't select values." | Implemented `createPortal` + fixed-position menu, viewport-clamped, flips up when short on space, re-measures on scroll/resize. |
| 12 | "Modal dropdown should match the table's option styling, but the trigger should look like the other form inputs." | Replaced the native `<select>` with the custom dropdown; dialog-scoped styling override for the trigger only. |
| 13 | "Review the responsive behaviour for desktop, tablet, and mobile, and fix it." | Four breakpoints (1100/900/640/420px): sticky mobile top bar, reflowing stats grid, stacked toolbar, CSS-only table→card view on phones. |
| 14 | "Add automated tests covering lead validation, the API, and the frontend flows." | 47 backend tests (validators + API over in-memory MongoDB) and 34 frontend tests (forms, dropdown, debounce, page flows); stale comments removed. |
| 15 | "Review the implementation for bugs and edge cases. Fix issues without changing requirements or adding unnecessary complexity." | General review pass — no functional changes needed beyond what's logged above. |

---

## 3. AI-Generated vs. Manually Written

### AI-Assisted / AI-Generated

- Backend routes, controllers, services, models, and validation/error handling
- Frontend component split, API integration, search/filter/pagination logic
- Lead status update and delete functionality
- Responsive UI implementation and dropdown behaviour
- Automated test setup and test cases (backend + frontend)
- Refactoring and debugging changes
- Initial README and AGENT.md drafts

AI-generated code was treated as a starting point — reviewed, tested, and modified where necessary, never merged unreviewed.

### Manually Written / Human-Directed

- Defining the assignment scope and required functionality
- Selecting React, TypeScript, Express, and MongoDB
- Designing the overall application architecture
- Deciding which features to include or exclude
- Reviewing and modifying every AI-generated change
- UI/UX decisions and visual feedback (the assistant could not see the rendered UI — all visual defects were found by the human and reported as prompts)
- Manual application testing across desktop and mobile widths
- Final verification of API and frontend behaviour
- MongoDB Atlas configuration
- Vercel and Railway deployment configuration
- Git repository and commit management (all commits authored and pushed by the developer)
- Final documentation review

---

## 4. Key Engineering Decisions

**Technology stack.** React + TypeScript + Vite (frontend), Node.js + Express + TypeScript (backend), MongoDB Atlas + Mongoose (database), deployed to Vercel and Railway respectively — chosen to keep the implementation simple, familiar, and scoped to the assignment.

**Layered backend architecture.**
```
Route → Controller → Service → Model → MongoDB
```
Separates HTTP handling, business logic, and database operations. Each layer has one responsibility, so features (validation, delete, error mapping) could be added without touching unrelated code.

**Server-side search and pagination.** Search is regex-based over name/email/phone and runs server-side so the table, pagination, and totals stay correct for the full dataset rather than loading everything into the browser. The frontend debounces (500ms) before firing a search request, keeping request volume low while typing.

**Validation on both sides, hand-rolled.** Client-side validation gives instant feedback; server-side validation is the source of truth (required fields, email/phone format, allowed statuses, pagination bounds, invalid IDs, duplicate emails — the last also enforced by a unique DB index). Hand-rolling avoided extra dependencies at the cost of some duplicated rules, documented as a trade-off with Zod named as a future improvement.

**Single error contract:** `{ message, errors? }`. Mongoose/Mongo errors are mapped to HTTP codes in one place, so controllers stay thin and the frontend has one shape to parse — `errors` is a `field → message` map that lets the form place messages under the right input.

**Lead status is fixed to four values** (`New`, `Contacted`, `Qualified`, `Converted`) — intentionally limited to the assignment's core workflow, extensible later if needed.

**Authentication was intentionally not implemented** — not part of the assignment requirements. The layered structure can accept auth middleware if this becomes a multi-user system.

**Scope management.** Prioritized the required functionality over unrelated features. Lead deletion was included as a low-cost bonus; nothing else was added purely for polish.

**Minimal dependencies.** Only `express`, `cors`, `dotenv`, `mongoose` on the backend, no validation/UI-kit libraries — fewer dependencies means less supply-chain and upgrade risk.

---

## 5. Where the AI Got It Wrong

Two real bugs are recorded here because they show genuine engineering judgment applied to AI output, not just acceptance of it.

### 5.1 The dropdown regression

**Request:** close all dropdowns on outside click.

**What the AI did:** added a shared "open signal" counter passed down to every dropdown, with each one closing itself whenever the counter changed.

**The bug:** opening a dropdown bumped the counter, which re-rendered that same dropdown, whose effect then closed it in the same tick — no menu could ever stay open (worse under React StrictMode's double-invoked effects).

**Fix:** removed the mechanism entirely. It was unnecessary — each dropdown already closed on any outside `pointerdown`, and opening a second dropdown *is* an outside click for the first.

**Lesson:** the simplest mechanism that satisfies the requirement usually beats shared coordination state.

### 5.2 Covering menus — wrong root cause, then the real one

**Request:** fix dropdown options rendering underneath other buttons.

**First attempt:** raised `z-index` values. Didn't work, because the problem wasn't the z-index value.

**Real root cause:** the status trigger gets a `transform` on hover, and a `transform` creates a new stacking context. The menu was nested inside that trigger, so its z-index only applied *within* that context — no value could escape it.

**Fix:** rendered the menu in a portal on `document.body` with `position: fixed`, positioned from the trigger's bounding rect and viewport-clamped. A stacking context can't contain a portaled child, so the menu now always paints on top.

**Lesson:** when a z-index change doesn't work, suspect a stacking context created by `transform`, `filter`, `opacity`, or `will-change` on an ancestor.

---

## 6. Testing & Verification

**Backend tests** cover request validation, lead creation/listing/search/filtering/pagination, status updates, deletion, duplicate-email handling, invalid requests, invalid resource IDs, and HTTP error responses (47 tests, in-memory MongoDB).

**Frontend tests** cover the API/service layer, form validation, the lead creation flow, status dropdown behaviour, search debounce, and page-level flows (34 tests).

**Additional verification:** TypeScript strict type-checking (`tsc --noEmit`), production builds for both packages, live API smoke tests (health, create, search + pagination, validation errors, status update, delete, 404), manual UI testing across desktop/tablet/mobile widths, and `git status` checks to confirm nothing was auto-committed by the assistant.

---

## 7. Known Limitations

- Authentication and authorization
- Browser-level end-to-end (Playwright) testing
- CI/CD test pipeline
- Rate limiting
- Full accessibility (WCAG/axe) audit
- Advanced role-based permissions

These are documented as future improvements rather than silently assumed done.

---

## 8. AI Usage Principles

1. AI suggestions were reviewed rather than accepted blindly.
2. Existing code was inspected before making significant changes.
3. Requirements and engineering decisions remained human-directed.
4. Generated code was verified through tests, builds, and manual testing.
5. Unnecessary dependencies and over-engineering were avoided.
6. Observed application behaviour was used to validate AI-generated changes.
7. Git history and commits remained under human control.
8. Final responsibility for the submitted implementation remained with the developer.