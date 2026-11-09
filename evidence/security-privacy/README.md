# Security and privacy evidence

Source inspected on 2026-11-10 at commit `754ad2a`. "VERIFIED (source)" means the code exists and the related automated test passes. It does not mean a live attack test was done. This is a technical review, **not** a PDPA compliance certificate.

## Controls present (VERIFIED, source + passing tests)

| Control | Source | Test |
|---|---|---|
| Passwords hashed (Better Auth), minimum 12 characters | `web/src/lib/auth.ts` (lines 24–27) | `auth.test.ts`, `advisor-registration.test.ts` |
| HttpOnly, SameSite=Lax cookies; database sessions; logout revokes | `web/src/lib/auth.ts` (line 78) | `auth.test.ts` ("session revocation") |
| Login/registration rate limiting (60 per 60 s, stored in DB) | `web/src/lib/auth.ts` (line 77) | the test log warns that a trusted client-IP header isn't set. Production behaviour **not verified** |
| Origin check on authenticated writes (403 `INVALID_ORIGIN`) | `web/src/app/api/workspace/route.ts` (lines 17–20); `trustedOrigins` in `auth.ts` line 23 | `auth.test.ts` ("Invalid origin: https://untrusted.example" rejected) |
| Unauthenticated workspace API returns 401 | `web/src/app/api/workspace/route.ts` (line 14) | **also observed live**: cloud `/api/workspace` → 401 |
| Role checks: only students request/cancel; only the addressed advisor accepts; only advisors review | `web/src/lib/workspace.ts` (lines 205, 214, 220, 274) | `connections.test.ts`, `workspace.test.ts` |
| Advisors see only assigned students | `web/src/lib/workspace.ts` (lines 62, 73, 278) | `workspace.test.ts` (sqlite + postgres) |
| Reports only for the student's own **approved** application | `web/src/lib/workspace.ts` (line 255) | `workspace.test.ts` |
| No duplicate application / week report (DB unique constraints) | `web/src/lib/workspace.ts` (lines 32–33) | `workspace.test.ts` |
| One pending request per student; transactional acceptance | `web/src/lib/workspace.ts` (lines 38, 223–224) | `connections.test.ts` |
| Stale-review protection (version numbers) | `web/src/lib/workspace.ts` (lines 173, 190, 290) | `workspace.test.ts` ("version conflicts") |
| Strict input schemas (zod) | `workspace.ts`, `student-login.ts` | multiple |
| Webhook HMAC-SHA256 signing and constant-time secret check | `web/src/lib/core.ts` (lines 15, 20) | `integration.test.ts` |
| Env files and local DBs not committed | `.gitignore` (only `web/.env.example` tracked; checked 2026-11-10) | n/a |

## Gaps still open (rechecked 2026-11-10)

| # | Gap | Status now |
|---|---|---|
| 1 | `/api/identity/claims` uses `requireAccount`, so any signed-in user can request another student's claims | **Still open** (`web/src/app/api/identity/claims/route.ts` line 7). This is a policy decision for the team. Not changed by this session |
| 2 | Advisor self-registration has no staff verification | **Still open** |
| 3 | No privacy notice / retention / export / deletion feature | **Still open**. No match for "privacy", "retention" or "pdpa" in `web/src` |
| 4 | No CSP, X-Frame-Options, X-Content-Type-Options | **Still open**. Live home page has HSTS only, plus `X-Powered-By: Next.js` (see routes recheck). `next.config.ts` sets no headers |
| 5 | Production config (DB roles, backups, log retention, client IP for rate limit) | **Not audited**. Needs Vercel/Supabase access |

## PENDING screenshots (negative tests, separate from the happy path)

| File | Who | Steps / expected |
|---|---|---|
| `01-unauth-workspace-401.png` | Anyone | Open https://team17-internship.vercel.app/api/workspace in a private window → 401 JSON. *(Text version already VERIFIED in the routes recheck)* |
| `02-wrong-password-rejected.png` | Student | Wrong Identity password → clear error, still on sign-in page, no session |
| `03-duplicate-report-rejected.png` | Student | Submit the same week again for the same application → conflict message |
| `04-unassigned-advisor-denied.png` | A **second** demo advisor | Has no assigned students → sees none of the demo student's records. Don't use a real student's data |
