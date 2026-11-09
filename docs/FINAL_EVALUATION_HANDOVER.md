# Final evaluation handover: Team 17 Internly

For the teammate or next owner preparing and presenting the final evaluation. Written 2026-11-10 (Asia/Bangkok) from commit `754ad2a`. The execution prompt that produced this is [`Handover.md`](Handover.md).

## Tested release

| | |
|---|---|
| Public URL | https://team17-internship.vercel.app |
| Deployed commit | **Unknown.** Check Vercel → Deployments. Earlier work reported `64e6b69`; main HEAD is `754ad2a` |
| Last route recheck | 2026-11-09T17:32Z (10 Nov 00:32 Bangkok). All routes respond; see [routes recheck](evidence/2026-11-10-routes-recheck.txt) |
| Last local validation | 35/35 tests, typecheck, build, audit 0 (see [`../evidence/testing/README.md`](../evidence/testing/README.md)) |

## Architecture

- **Next.js 16 app** in `web/` (App Router), deployed on Vercel. The Vercel root directory should be `web`. Confirm this in Vercel.
- **Auth**: Better Auth (`web/src/lib/auth.ts`). Email/password for advisors and admins; Student Identity credential login plugin (`web/src/lib/student-login.ts`). DB sessions, HttpOnly cookies.
- **Workspace data**: applications, reports, connection requests and assignments in `web/src/lib/workspace.ts` (SQL works on SQLite locally and PostgreSQL in the cloud). API: `GET/POST /api/workspace` (action-based).
- **Placements catalogue**: `GET /api/placements`, `/api/placements/{id}`. Public, CORS `*`, PostgreSQL (Supabase) with a read-only role. Contract in [`handover/`](handover/README.md). Keep those paths, because partners link to them.
- **Team 18 Job Board** adapter: `web/src/lib/job-board.ts` → `GET /api/jobs`, `/api/jobs/{id}` (10 s timeout, demo labels kept).
- **Team 19 status** consumer: `GET /api/integration/partner-status` (`web/src/lib/core.ts`).
- **A5 webhooks**: `web/src/app/api/webhooks/partner`, `api/integration/status-events`, HMAC in `core.ts`.
- **Hosted DBs**: `AUTH_DB_MODE=postgres` + `AUTH_DATABASE_URL`, `PLACEMENTS_DB_MODE=postgres` + `PLACEMENTS_DATABASE_URL`. Local modes use files under `web/.data/` and never touch production.

## Roles and workflow

| Role | Page | Can do |
|---|---|---|
| Student | `/workspace` | Identity login; request/cancel an advisor; apply; see decisions; weekly reports for approved application; read feedback |
| Advisor | `/advisor` | Self-register; accept/reject requests; see **assigned** students only; approve/reject applications; give report feedback |
| Admin | `/advisor` | All records (local setup creates one) |

Rules: one advisor and one pending request per student; reports need an approved application; one application per opportunity; one report per week; stale reviews rejected (409). Full detail: [`STUDENT_ADVISOR_WORKFLOW.md`](STUDENT_ADVISOR_WORKFLOW.md).

## Local setup (Windows or macOS, Node 24)

```text
cd web
npm ci
# fresh checkout only: copy .env.example to .env.local (never overwrite an existing one)
npm run placements:setup
npm run auth:setup        # creates local admin; creds in web/.env.auth-admin.local (git-ignored)
npm run advisor:setup     # creates local advisor; creds in web/.env.advisor.local (git-ignored)
npm run dev -- --webpack --hostname localhost --port 3000
```

`BETTER_AUTH_URL` and `PUBLIC_SITE_URL` must equal the exact browser origin. `localhost` and `127.0.0.1` are different origins. Restart after changing env. Student Identity login works locally only with network access to the Identity service and a real student account.

Checks (from `web`):

```text
npx tsx --conditions=react-server --test --test-concurrency=1 tests/*.test.ts
npm run typecheck
npm run build -- --webpack
npm audit
```

## Source walkthrough

Suggested split: each member explains one row.

| Topic | Files | Key points |
|---|---|---|
| Login and Identity trust | `lib/auth.ts`, `lib/student-login.ts` | Hashing, min length, cookies, rate limit; `/auth/login` → `/me` ID match → 15-min session |
| Route guard | `app/api/workspace/route.ts` | 401 when not logged in; 403 on bad Origin; zod body validation |
| Data model + permissions | `lib/workspace.ts` | Tables + unique constraints; assignment-scoped SQL; version checks; transactional acceptance |
| UI | `app/portal.tsx`, `app/connection-panel.tsx` | Tabs, forms, refresh-to-see-updates |
| Job Board | `lib/job-board.ts`, `app/api/jobs/*` | Normalization, timeout, demo labels |
| Partner APIs / webhooks | `lib/core.ts`, `app/api/integration/*`, `app/api/webhooks/partner` | Status consumer, HMAC signing, idempotency |

## API contracts

- Ours (public): `/api/placements` per [`handover/placements.openapi.json`](handover/placements.openapi.json); `/api/jobs` (same envelope, `data_source: team18-job-board`); `/api/integration/status`.
- Session-protected: `/api/workspace`. Not for partners.
- Consumed: Team 18 `https://team18-job-board-api.tawee-dev.workers.dev/api/jobs`; Team 19 status; Student Identity `/auth/login` + `/me` + claims.
- Note: the PRD's REST-style application/progress routes are implemented as actions on `POST /api/workspace` instead. The PRD's AI matching, status-change event fan-out and Campus Insights export are **not** implemented (see [readiness](FINAL_EVALUATION_READINESS.md#supplied-prd-cross-check)).

## Known limitations

See [`../evidence/security-privacy/README.md`](../evidence/security-privacy/README.md). In short: broad claims access, unverified advisor registration, no privacy notice or retention, missing security headers, production config not audited, deployed commit unknown, no real cloud happy path observed yet.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `INVALID_ORIGIN` / "Invalid origin" on login or save | `BETTER_AUTH_URL` doesn't match the browser origin (e.g. localhost vs 127.0.0.1) |
| Student and advisor sessions keep swapping | Both in the same browser profile. Use separate profiles |
| "Choose an available advisor…" (409) | Student already has a pending request or an advisor |
| Can't submit report | Application not approved yet, or that week already submitted |
| Review fails with conflict | Someone else changed it. Refresh and retry |
| `/api/jobs` error | Team 18 provider down or slow (10 s timeout) |
| Build runs out of memory locally | Use `--webpack`; tests with `--test-concurrency=1` |

## Next-owner instructions

1. Read [`../submission/FINAL_EVALUATION_CHECKLIST.md`](../submission/FINAL_EVALUATION_CHECKLIST.md) and work top to bottom.
2. Don't deploy, migrate production or change access policy without the team agreeing. Don't deploy during Team 19's 10 Nov 13:00–18:00 window.
3. Put new screenshots in the listed `evidence/` filenames, then update [`../evidence/manifest.json`](../evidence/manifest.json) and [`../evidence/README.md`](../evidence/README.md).
4. Never commit `.env*` (except `.env.example`), `web/.data/`, or HAR files.
