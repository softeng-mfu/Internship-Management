# Final evaluation readiness audit

Audited 9 November 2026 (Asia/Bangkok), against commit `64e6b69`, the supplied evaluation announcement, and `/Users/mac/Downloads/PRD_Internship.md`. The supplied PRD is assessment input, not authorization to deploy or alter remote data.

**Overall: not ready for final evaluation yet.** Core workflows pass local automated tests, and a public deployment exists, but the current student/advisor workflow is missing from that deployment. Privacy controls and evaluation evidence also need work.

> **Update 10 November 2026:** see [Recheck — 10 November 2026](#recheck--10-november-2026) at the end. The four missing cloud routes are now deployed; the overall status is still **not ready** because the cloud happy-path evidence is pending. The observations below are the original 9 November audit, kept unchanged.

Evidence: [HTTP and audit results](evidence/2026-11-09-readiness.json), [test summary](evidence/2026-11-09-tests.txt), [production build output](evidence/2026-11-09-build.txt). These are actual observed results, not planned results. No production deployment, remote database migration, personal-data lookup, or outgoing webhook was performed during this audit.

## 1. System completion and cloud deployment — incomplete

Read-only public checks on 9 November at approximately 23:39 Bangkok time:

| Public route on https://team17-internship.vercel.app | HTTP result |
| --- | --- |
| `/` | 200, Internly page |
| `/sign-in` | 200 |
| `/api/integration/status` | 200, success |
| `/api/placements` | 200, six listings |
| `/api/auth/get-session` | 200 for an unauthenticated request; this alone does not prove login works |
| `/api/jobs` | **404** |
| `/workspace` | **404** |
| `/advisor` | **404** |
| `/api/workspace` | **404** |

These routes exist in the current source and successful local build. Their public absence indicates the deployed release does not contain the current workflow. An exact production commit was not available to inspect. Git push alone has not established that the updated application is deployed.

Before release: confirm the Vercel project/root (`web`), persistent hosted authentication/workspace database, required Better Auth fields and workspace tables/indexes, server-only credentials, and exact HTTPS `BETTER_AUTH_URL`/`PUBLIC_SITE_URL`. Use PostgreSQL mode for hosted authentication and placements. Local SQLite/PGlite files are not a production database. `web/scripts/prepare-hosted-auth.ts` and the placements preparation script are preparation sources, not proof that their migrations ran in production.

After deployment, check the routes above, sign in with both real roles, submit/review a real test application and report, log out/in, and verify persistence. Preserve existing production data and use separately provisioned production accounts and secrets.

## 2. Features and happy path — locally implemented; deployed demonstration pending

Implemented in `web/src/lib/workspace.ts`, `web/src/app/api/workspace/route.ts`, `web/src/app/portal.tsx`, and `web/src/app/connection-panel.tsx`:

- Verified Student Identity login persists the student's ID and name locally.
- Advisor registration/login; searchable advisor names; student introduction/request.
- Advisor acceptance/rejection; pending-request cancellation; one advisor per student and many students per advisor.
- Opportunity browsing, application submission, assigned-advisor review and approval/rejection.
- Weekly reports for the student's own approved internship; assigned-advisor feedback visible to the student.
- Ownership checks, assignment scope and stale-version checks on reads/writes.

Happy path to demonstrate on the cloud: **student login → request advisor → advisor accepts → student applies → advisor approves → student submits report → advisor gives feedback → student reads feedback**. Separate browser profiles/private sessions are needed for simultaneous roles because normal tabs share login cookies.

Current restrictions: reports require approved applications; duplicate applications and duplicate application/week reports are rejected; final approval/rejection cannot be changed through the current review screen; student-initiated replacement of an accepted advisor is not implemented.

## 3. Cross-group API/Webhook integration — one live API consumption verified

The deployed `GET /api/integration/partner-status` returned HTTP 200 with `success=true`, partner `pod5-alumni-network`, and status `ok` at `2026-11-09T16:40:05.845Z` (23:40 Bangkok). This is a real cross-group read-only API call, satisfying the minimum integration mechanism in the announcement. The source is `web/src/app/api/integration/partner-status/route.ts` and the supporting HTTP adapter in `web/src/lib/core.ts`.

The Team 18 Job Board provider also returned 200 (27 matching listings). Our local `/api/jobs?limit=1` returned 200 with source `team18-job-board`. Source: `web/src/lib/job-board.ts`, `/api/jobs` routes, and `web/tests/job-board.test.ts`. This feature is **not currently available at the public deployment**, where `/api/jobs` is 404. Fictional partner listings are labeled as sample data; our student applications are real local records and are not sent to Team 18.

Capture a fresh cloud consumer request/response, the relevant source, and matching hosting logs for the demonstration. Coordinate availability with the partner. Do not claim successful incoming/outgoing webhooks from mocked tests or a manually supplied `source` field. The older A5 report explicitly leaves real webhook confirmation and coordinated outage evidence pending. A successful read-only integration is sufficient for the announcement's “API or Webhook” minimum; every historical A5 webhook proof is not a new requirement of this announcement.

## 4. Development process and AI evidence — partial

Available: Git repository/history, commits from several author identities, architecture/PRD/design documents, `docs/prompts/` prompts, tests, and current workflow documentation. Recent work includes login-origin correction, advisor connections, reporting UX, role checks and extension-related hydration handling.

Still collect: a short contribution table linking each member to actual commits/work, the development/review workflow, and concrete AI-use examples describing tool, task, generated suggestion, human review/correction, and validation. Prompt templates and commit author names alone do not prove every member's work or understanding. This chat is AI-use context; a reviewed, redacted evidence excerpt should be added by the team if needed. No contribution or attendance claim has been invented.

Documentation discrepancies to resolve:

- `docs/DEPLOYMENT_STATUS.md` says public placements are 404 and the homepage is the original A5 page. Current HTTP results differ.
- `docs/AUTHENTICATION.md` and `docs/IDENTITY_INTEGRATION.md` mix historical email signup, administrator-only claims, and old local URLs with newer updates.
- `docs/Data_and_Query_Design.md` references an initial internship migration that is absent from the repository. Its proposed approvals/history/outbox design is not the current runtime schema.
- The A5 evidence roster contains a repeated student ID; have the team verify its accuracy without republishing private credentials.

## 5. Security and PDPA evidence — implemented controls; important gaps

Implemented controls with source/tests:

| Control | Evidence |
| --- | --- |
| Password hashing, database sessions, logout revocation, HttpOnly/SameSite cookies | `web/src/lib/auth.ts`; auth and advisor-registration tests |
| Student Identity role/ID/expiry verification; provider password/token not persisted | `web/src/lib/student-login.ts`; student-login tests |
| Origin validation on authenticated writes | workspace route, auth plugins, `admin-access.ts`; auth/workflow tests |
| Assigned-advisor and student ownership checks | `workspace.ts`; SQLite/PostgreSQL tests |
| Parameterized SQL, strict input schemas, bounded JSON requests, generic errors | workspace store/route and `core.ts`; tests |
| Duplicate prevention, transactional acceptance, stale-review conflict checks | database constraints and connection/workspace tests |
| Login/registration rate limiting | auth configuration/plugins; production client-IP handling still needs verification |
| Signed outgoing webhook payloads, incoming secret verification, idempotency | `core.ts`, webhook/event routes, SQL migration, integration tests |
| Verified TLS for configured hosted database connections | auth/placements/activity database clients |
| Private environment files/local data ignored | `.gitignore`, `.vercelignore`; only the public `.env.example` is tracked |

Fresh `npm audit`: **zero known vulnerabilities** across the installed dependency tree. This is not a penetration test. A targeted tracked-file pattern review and selected private environment-path history check found no confirmed exposed credentials; that is not an exhaustive historical secret audit.

Outstanding findings:

1. **Identity claims access is broader than student ownership or advisor assignment.** `/api/identity/claims` uses `requireAccount`; any signed-in account can submit another student's ID. Provider consent authorizes the service, but the local route does not establish which app user may read the requested student's claims. Restrict students to their verified ID and advisors to assigned students, or keep the shared demo endpoint restricted to trusted operators. Earlier session instructions intentionally allowed broad signed-in access; this audit reports the risk and does not silently change that policy.
2. **Advisor registration does not verify staff status.** A registrant becomes an advisor without email/staff verification. Student acceptance limits record sharing, but the directory does not establish institutional approval. Define who may register and how an advisor is approved for the evaluation/production environment.
3. **Privacy readiness evidence is incomplete.** No current user-facing privacy notice or implemented retention/deletion/export workflow was found. Document collected data, purposes, access, sharing, retention, contact and operational handling. Use consenting demo participants and redact student names/IDs in shared evidence where unnecessary. This is a technical evidence review, not a legal certification of PDPA compliance.
4. **Response hardening is incomplete.** The public homepage has HSTS but no CSP, X-Frame-Options or X-Content-Type-Options. Add/test a suitable CSP including frame restrictions and MIME hardening. Do not claim headers alone prevent all attacks.
5. **Production configuration was not audited.** Verify least-privilege database roles, HTTPS cookies, backups/recovery, log access/retention and trusted client-IP/rate-limit configuration in the actual host. Local tests warn that requests without a client IP share a rate-limit bucket; this does not establish the production behavior.

Do not mark “PDPA compliant” solely from authentication, encryption or an upstream consent toggle.

## 6. Testing and quality assurance — automated pass; human/cloud evidence pending

Fresh checks:

- `npm test`: **35 passed, 0 failed, 0 skipped**, approximately 4.85 seconds. Covers login/registration, roles, ownership, advisor requests, cancellation/rejection/acceptance, report feedback, duplicate/stale writes, consent denials, integration timeouts/recovery and webhook/idempotency behavior.
- `npm run build`: successful compilation, TypeScript checking and page generation.
- `npm audit`: zero known vulnerabilities.
- Public GET checks and local live Job Board read: recorded in the JSON evidence.

Mocked provider responses and PGlite tests are automated evidence, not real student credentials, live partner webhook execution or human verification. Earlier user screenshots and successful local usage indicate human testing, but a reviewed deployed manual-test record with tester/time/result has not been supplied. Rejected invalid inputs count as successful negative tests, not failed test runs. Record actual defects and retest outcomes separately.

### Manual tests to record after deploying the latest release

| Test | Expected result | Current evidence status |
| --- | --- | --- |
| Student login with valid Identity account | Correct verified student workspace | Pending cloud human test |
| Incorrect credentials | Clear rejection; no session | Automated evidence available; cloud capture pending |
| Advisor registration/login | Advisor workspace; no existing student access | Pending cloud human test |
| Request → accept | Student/advisor see the connection | Pending cloud human test |
| Reject/cancel request | No assignment; another request possible | Automated evidence available; cloud capture pending |
| Application → advisor approval | Student sees approval; report form becomes usable | Pending cloud human test |
| Report → feedback → student reads feedback | Data persists across logout/reload | Pending cloud human test |
| Another student/unassigned advisor accesses a record | Access denied; no record changed | Automated evidence available; cloud capture pending |
| Duplicate application/week or stale review | Controlled conflict; no duplicate/overwrite | Automated evidence available; cloud capture pending |
| Cloud Job Board read | Real partner results with request/response evidence | Local live read passed; public adapter is 404 |
| Identity claims without matching consent | Denied, no secret returned | Automated evidence available; configured cloud test pending |

## 7. Source understanding and live modification — team rehearsal required

Prepare each member to explain: login and Identity trust (`auth.ts`, `student-login.ts`); route/session/origin checks (`api/workspace/route.ts`); data model and atomic permissions (`workspace.ts`); request/report UI (`portal.tsx`, `connection-panel.tsx`); partner normalization (`job-board.ts`); webhook signing/idempotency (`core.ts`, event routes/migration).

Rehearse a small visible text change, run the relevant check/build, redeploy through the actual project, and verify the public URL. No live redeploy rehearsal or individual member explanation was witnessed in this audit. A successful local build does not prove cloud deployment access.

## 8. Attendance and partner coordination — not independently verifiable

The team must confirm every member's attendance, evaluation slot, responsibility and backup demonstration role. Contact the partner group in advance and confirm service uptime and consent/key configuration where needed. No messages were sent to partner groups in this audit. Attendance and coordination cannot be marked complete from source code.

## Supplied PRD cross-check

The announcement's minimum integration requirement and the PRD's broader feature targets are different scopes. One successful partner API call does not establish completion of every PRD integration.

| PRD target | Current implementation and remaining gap |
| --- | --- |
| Opportunity explorer, application tracker, advisor approval queue, progress updates | Implemented locally with persistent records and scoped access; current cloud role routes are absent |
| `GET /placements` and placement detail | Available as `/api/placements` and `/api/placements/{id}`; public list verified |
| Application REST routes and progress-update route | Equivalent operations use action-based `POST /api/workspace` and scoped `GET /api/workspace`; the exact REST route names in the PRD are not implemented. Document the revised contract or add compatibility routes if another team depends on it |
| Approved Identity profile/skills claims | Adapter and mocked consent/error tests exist; real service registration, matching service key and consent must be verified. Local caller authorization is a privacy gap described above |
| Job Board listings | Actual Team 18 API consumption implemented and locally checked; public adapter still 404 |
| Publish `internship.status_changed` to Notification Hub, Advising and Analytics | Separate operator-triggered A5 demo event/webhook exists. Real application approval in `workspace.ts` does not publish these events; no three-consumer routing is implemented |
| Anonymized placement trends to Campus Insights | No implemented export/aggregate route or delivery evidence found |
| AI skills-to-placement matching with tag-filter fallback | No personalized AI ranking or student-claims-based matching found. Keyword search includes job skill prose and the placements catalogue has skill filters; these are not evidence of personalized matching |
| At least seven tests: browse, apply, duplicate, approval, progress, consent, status event | These categories have automated coverage within 35 passing tests. Consent/provider and webhook delivery tests use mocks as documented; the real-workflow event trigger remains absent |

## Prioritized completion plan

1. Resolve the Identity claims authorization policy and prepare the actual production database/configuration.
2. Deploy the current main release and verify that `/workspace`, `/advisor`, `/api/workspace` and `/api/jobs` no longer return 404. An unauthenticated protected route should redirect or return 401, not expose private data.
3. Run and record the complete two-role happy path on the cloud. Confirm persistence and scoped access.
4. Capture the real cloud partner request/response and source/log correlation. Coordinate partner availability.
5. Complete privacy/security evidence and correct the conflicting historical documentation.
6. Add the human test record, contribution/AI-use evidence and a rehearsed minor-change/redeploy procedure. Confirm all members' attendance.

## Suggested eight-minute demonstration

| Time | Demonstration |
| --- | --- |
| 0:00–0:45 | Public HTTPS URL, system architecture, role boundaries |
| 0:45–1:45 | Student Identity login and live Job Board listing/details |
| 1:45–2:45 | Student request and advisor acceptance in separate sessions |
| 2:45–4:00 | Student application and advisor approval |
| 4:00–5:00 | Student report, advisor feedback, student sees feedback |
| 5:00–6:00 | Partner request/response and one negative authorization/duplicate test |
| 6:00–7:00 | Automated/human test evidence and privacy/security controls |
| 7:00–8:00 | Team contributions, AI-use example, source explanation and redeploy readiness |

Prepare genuine consenting demonstration accounts and available listings beforehand. Keep screenshots as evidence, but perform the actual cloud workflow during evaluation. Do not substitute a mock integration, local-only demonstration or manually preapproved database record for a claimed live action.

## Recheck — 10 November 2026

Rechecked 2026-11-09T17:32Z (10 Nov 00:32 Asia/Bangkok) from repository commit `754ad2a`, branch `final-eval-handover`. Read-only checks only: nothing was deployed, migrated, pushed or sent to partners. The actual evaluation announcement/rubric was **unavailable** to this recheck, so the statement in section 3 that one API-or-webhook integration meets the minimum is carried over unverified.

**Overall: still not ready.** Deployment has moved forward, but the mandatory cloud happy-path evidence is still pending.

| Area | 9 Nov | 10 Nov recheck | Evidence |
| --- | --- | --- | --- |
| Cloud routes | `/api/jobs`, `/workspace`, `/advisor`, `/api/workspace` = 404 | **Resolved:** 200 / 307→sign-in / 307→sign-in / 401 (correct for an unauthenticated request) | [routes recheck](evidence/2026-11-10-routes-recheck.txt) |
| Deployed commit | Not inspected | Still **unknown** (no Vercel access, no GitHub deployment records) | same |
| Cloud Job Board | 404 | **Resolved:** `/api/jobs` 200, 12 Team 18 listings; detail 200 | [job-board-api](../evidence/job-board-api/README.md) |
| Team 19 status consumption | 200 | 200, partner status `ok` | [partner-status](../evidence/cross-group-api/2026-11-10-partner-status-response.json) |
| Team 19 consuming us | not recorded | PARTNER-REPORTED (request `a461ec05-…`, 07:13:44 UTC 9 Nov); our re-run of their query 200 | [partner report](../evidence/cross-group-api/partner-reported-team19.md) |
| Tests / build / audit | 35/35, pass, 0 | 35/35 (sequential), typecheck + build pass, 0 vulnerabilities (LOCAL, Node 24.18.1) | [tests](evidence/2026-11-10-tests.txt), [build](evidence/2026-11-10-build.txt), [audit](evidence/2026-11-10-audit.txt) |
| Security findings 1–4 | open | **Still open** (claims route still `requireAccount`; no staff verification; no privacy notice/retention code; live site still lacks CSP/X-Frame-Options/X-Content-Type-Options) | [security-privacy](../evidence/security-privacy/README.md) |
| Cloud happy path | pending | **Still pending; not observed** | [happy-path](../evidence/happy-path/README.md) |
| Contributions / AI use | partial | Commit summary added; identities and AI-use rows need team input | [development-process](../evidence/development-process/README.md) |

`docs/DEPLOYMENT_STATUS.md` (7 Nov) is now out of date: placements and the Internly frontend are live. It is left unchanged as a historical record.

New finding: Team 19 asked Team 17 to keep the API online on **10 Nov 13:00–18:00** for their evaluation.

Next actions: [`submission/FINAL_EVALUATION_CHECKLIST.md`](../submission/FINAL_EVALUATION_CHECKLIST.md).
