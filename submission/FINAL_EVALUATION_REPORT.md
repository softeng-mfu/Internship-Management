# Final evaluation report: Team 17 Internly (Internship Management)

Prepared 2026-11-10 (Asia/Bangkok) on branch `final-eval-handover`, from repository commit `754ad2a`. Live site: https://team17-internship.vercel.app.

**Rubric unavailable.** The official final-evaluation announcement could not be found in the repository or obtained during preparation. This report is organised by the seven priority areas in [`docs/Handover.md`](../docs/Handover.md) and gives no weights. If the announcement is found, re-map the sections to it.

**Overall: not yet ready.** The cloud release now contains the full workflow, and the automated checks pass. The mandatory **cloud happy-path evidence has not been captured or observed**. See the [checklist](FINAL_EVALUATION_CHECKLIST.md).

## 1. System completion and cloud deployment

On 9 Nov (16:39 UTC) the public site returned 404 for `/api/jobs`, `/workspace`, `/advisor` and `/api/workspace`. **On recheck (2026-11-09 17:32 UTC = 10 Nov 00:32 Bangkok), all of these respond:** `/api/jobs` 200 with 12 Team 18 listings, `/workspace` and `/advisor` redirect to sign-in (307), and `/api/workspace` returns 401. These are the correct responses for a visitor who isn't logged in. A newer release has therefore been deployed. **Its exact commit is unknown**: there are no GitHub deployment records and no Vercel access in this session. Evidence: [routes recheck](../docs/evidence/2026-11-10-routes-recheck.txt) · [cloud-deployment](../evidence/cloud-deployment/README.md).

Not yet shown: the production deployment commit, and proof that hosted auth/workspace data uses PostgreSQL. Both need someone with Vercel access.

## 2. Student/advisor happy path

Implemented in `web/src/lib/workspace.ts`, `web/src/app/api/workspace/route.ts`, `web/src/app/portal.tsx` and `web/src/app/connection-panel.tsx`. The full sequence (Identity login → request → accept → apply → approve → report → feedback → read feedback) is covered by local automated tests on SQLite and PostgreSQL.

**The complete cloud happy path has NOT been observed.** All 14 screenshots are PENDING. They need a consenting student with their own Identity password and an advisor, in separate browser profiles. See [happy-path](../evidence/happy-path/README.md) and [DEMO_SCRIPT](DEMO_SCRIPT.md).

## 3. Cross-group API integration

| Integration | Status | Evidence |
|---|---|---|
| We consume Team 19 (pod5-alumni-network) status API | VERIFIED live: 200, partner status `ok` | [response](../evidence/cross-group-api/2026-11-10-partner-status-response.json) |
| We consume Team 18 Job Board | VERIFIED live: `/api/jobs` 200, 12 listings, `data_source: team18-job-board`; detail 200 | [job-board-api](../evidence/job-board-api/README.md) |
| Team 19 consumes our `/api/placements` | PARTNER-REPORTED (request ID `a461ec05-1277-4b26-a79a-ed2b280d8ed7`, 2026-11-09 07:13:44 UTC). Our re-run of their query returns 200 with CORS `*` | [partner report](../evidence/cross-group-api/partner-reported-team19.md) |

The readiness audit states that one API-or-webhook integration meets the announcement's minimum. That could not be re-checked without the announcement. Team 19's offered `/api/mentors` is **not** consumed by our code. Internly applications to `jobboard-<id>` stay in our database and are not delivered to Team 18. Historical A5 webhook/outage proofs remain [supplemental and partly pending](../evidence/supplemental-a5/README.md).

## 4. Development process, contributions and AI use

Git history: 19 commits from 5 git identities (`nadizeya` 10, `ThanHtike01` 4, `Nadi Zeya` 3, `MinThein-Kyaw` 1, `kaungzeya-dev` 1). Two identities are probably the same person, which needs confirmation. Commit counts don't show attendance, understanding or non-code work. One real AI-use entry (this documentation session) is recorded. Teammates must add their own. See [development-process](../evidence/development-process/README.md).

## 5. Security and privacy

Present in source with passing tests: password hashing (min. 12 characters), HttpOnly/SameSite cookies with revocable DB sessions, origin checks on writes, role and assignment checks on every workspace read/write, report-only-after-approval, DB-level duplicate prevention, version-based stale-write protection, zod input validation, HMAC webhook signing, and server-side Identity `/me` verification with no password storage. Live: unauthenticated `/api/workspace` → 401.

Still open (rechecked today): (1) any signed-in user can request any student's Identity claims; (2) advisor self-registration is not staff-verified; (3) no privacy notice / retention / deletion / export; (4) no CSP, X-Frame-Options or X-Content-Type-Options on the live site (HSTS only); (5) production DB roles, backups and rate-limit client IP not audited. **No PDPA-compliance claim is made.** See [security-privacy](../evidence/security-privacy/README.md).

## 6. Testing

LOCAL, 2026-11-10, Node v24.18.1, commit `754ad2a`: **35/35 tests pass** (sequential, 26.2 s), typecheck pass, `next build --webpack` pass, `npm audit` 0 vulnerabilities. [tests](../docs/evidence/2026-11-10-tests.txt) · [build](../docs/evidence/2026-11-10-build.txt) · [audit](../docs/evidence/2026-11-10-audit.txt). Provider calls in the tests are mocked. The human cloud test record is PENDING ([template](../evidence/testing/manual-test-record.md)).

## 7. Code understanding, demo and redeploy readiness

The source walkthrough is in [FINAL_EVALUATION_HANDOVER.md](../docs/FINAL_EVALUATION_HANDOVER.md#source-walkthrough). The demo and redeploy rehearsal plan is in [DEMO_SCRIPT.md](DEMO_SCRIPT.md). No rehearsal, member explanation or attendance has been witnessed.

## Partner coordination

Team 19 asked us to keep our API online on **10 Nov 13:00–18:00** and to send them a log screenshot for their request ID. No message has been sent. A draft reply is in the [partner report](../evidence/cross-group-api/partner-reported-team19.md).
