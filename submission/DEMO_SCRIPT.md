# 8-minute demo script

Site: **https://team17-internship.vercel.app**. Adapted from the timing in [`FINAL_EVALUATION_READINESS.md`](../docs/FINAL_EVALUATION_READINESS.md).

## Prerequisites (do these the day before)

| Item | Details |
|---|---|
| Student browser | Browser profile **"Student"** (for example Chrome profile 2). Password-manager autofill off |
| Advisor browser | Separate profile/browser **"Advisor"** (for example Edge). **Not** a second tab in the Student profile |
| Student account | A consenting student with their own Student Identity login. They type their password themselves. They must have **no accepted advisor yet**, or use a fresh student |
| Advisor account | Created on the cloud site: *Advisor login → Create advisor account*, name like `Demo Advisor (Team 17)`, password at least 12 characters, kept by the advisor |
| Second advisor (optional) | For the negative test in 5:00–6:00 |
| Opportunity | A Team 18 listing the student hasn't applied to yet (check `/api/jobs`) |
| Backup | Happy-path screenshots in [`evidence/happy-path/`](../evidence/happy-path/README.md), once captured |
| Team 19 | Confirm their API is up. Don't run outage tests |

## Script

| Time | Who | Do this (URL) | Say | Evidence file this produces |
|---|---|---|---|---|
| 0:00–0:45 | Presenter | Open `/` in a normal window | Public HTTPS site on Vercel; Next.js + Better Auth + PostgreSQL; roles Student / Advisor / Admin | `cloud-deployment/02-public-site.png` |
| 0:45–1:45 | **Student** | `/sign-in` → Student login → own ID + password → `/workspace` | Password goes to our backend → Identity `/auth/login` → we check `/me` ID matches → 15-minute session. Password never stored | `happy-path/01`, `02`; `student-identity-login/01–03` |
| | **Student** | `/workspace` → Opportunities | Live Team 18 Job Board listings, labelled demo | `happy-path/07`; `job-board-api/01` |
| 1:45–2:45 | **Student** | Advisors → pick Demo Advisor → write intro → send | One pending request at a time | `happy-path/03`, `04` |
| | **Advisor** | `/advisor` → Students → request → Accept | Acceptance + assignment happen in one transaction | `happy-path/05`, `06` |
| 2:45–4:00 | **Student** | Opportunities → the chosen listing → Apply | Stored in **our** DB; not sent to Team 18 | `happy-path/08` |
| | **Advisor** | Applications → Approve + note | Only the assigned advisor can see/review this; version check stops stale overwrites | `happy-path/09` |
| | **Student** | Refresh → Applications | Approved + note visible | `happy-path/10` |
| 4:00–5:00 | **Student** | Progress reports → week N → submit | Only allowed for an approved application; one report per week | `happy-path/11` |
| | **Advisor** | Progress reports → feedback → save | | `happy-path/12` |
| | **Student** | Refresh → see feedback | | `happy-path/13` |
| 5:00–6:00 | Presenter | Open `/api/integration/partner-status` and `/api/placements?category=Engineering` | We consume Team 19; Team 19 consumes us (their request ID `a461ec05-…`) | `cross-group-api/*` |
| | Student or 2nd advisor | Submit same week again **or** 2nd advisor sees no records | Controlled rejection = the security working | `security-privacy/03` or `04` |
| 6:00–7:00 | Presenter | Show [`testing/README.md`](../evidence/testing/README.md) and [`security-privacy/README.md`](../evidence/security-privacy/README.md) | 35/35 tests, build, audit 0. Be honest about the open gaps (claims access, advisor verification, privacy notice, headers) | n/a |
| 7:00–8:00 | Each member | Each member explains one file (see the handover source walkthrough); AI-use example | Contributions + how AI output was checked | `development-process/README.md` |
| (end) | Student | Log out → log in → still there | Persistence | `happy-path/14` |

## Fallbacks

| Problem | What to do |
|---|---|
| Identity service down / login fails | Say so plainly. Show the screenshots from `happy-path/` and the [source reference](../evidence/student-identity-login/source-reference.md). **Don't** log in with a fake or local account and call it the cloud flow |
| Team 18 Job Board down | Our `/api/jobs` returns a controlled error. Show [`list-response.json`](../evidence/job-board-api/2026-11-10-list-response.json) and labelled screenshots. Apply to a `/api/placements` listing instead, and say so |
| Team 19 down | Show [`partner-status-response.json`](../evidence/cross-group-api/2026-11-10-partner-status-response.json) as a past capture with its timestamp |
| Vercel down | Run locally (`npm run dev -- --webpack`). Label it **LOCAL**, and don't claim it's the cloud |
| Student already has an advisor / report week used | Use a fresh student, or the next week number. Never reset the database |

## Redeploy rehearsal (practice before the evaluation, not during Team 19's 13:00–18:00 window)

1. Change one visible text (for example a heading in `web/src/app/page.tsx`) on a branch.
2. From `web`: run the tests, `npm run typecheck`, `npm run build -- --webpack`.
3. Push, merge and deploy through the real Vercel project (whoever has access).
4. Check the change on the public URL, and confirm the routes still respond (rerun the route check).
5. Record the time and commit, then revert the same way.
