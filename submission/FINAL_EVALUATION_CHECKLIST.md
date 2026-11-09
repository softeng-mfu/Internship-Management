# Final evaluation checklist

As of 2026-11-10 00:45 Asia/Bangkok. Owners are roles, not named commitments. The team assigns names.

## Verified

- [x] Cloud site up; all 9 required routes respond; former 404s fixed ([recheck](../docs/evidence/2026-11-10-routes-recheck.txt))
- [x] Protected routes behave correctly when not logged in (307 → sign-in, 401)
- [x] Deployed backend consumes Team 19 status API ([evidence](../evidence/cross-group-api/2026-11-10-partner-status-response.json))
- [x] Deployed `/api/jobs` serves Team 18 Job Board listings ([evidence](../evidence/job-board-api/2026-11-10-list-response.json))
- [x] Public `/api/placements` contract (Team 19's exact query) still works, with CORS ([evidence](../evidence/cross-group-api/2026-11-10-placements-partner-query.json))
- [x] 35/35 automated tests, typecheck, build, `npm audit` 0 (LOCAL) ([tests](../docs/evidence/2026-11-10-tests.txt))
- [x] Security controls present in source ([security](../evidence/security-privacy/README.md))
- [x] Commit history summarized ([process](../evidence/development-process/README.md))

## Partner-reported

- [ ] Team 19 consumed our `/api/placements` (request ID `a461ec05-…`). **Next:** Vercel log owner finds the ID, screenshots it, and sends it to Team 19.

## Blockers / pending: do these in order

| # | Action | Owner | Exact next step |
|---|---|---|---|
| 1 | **Keep the API online 10 Nov 13:00–18:00** for Team 19's evaluation | Whoever controls Vercel | Don't redeploy or break `/api/placements` in that window |
| 2 | Identify the deployed commit | Someone with Vercel access | Vercel → Deployments → Production → screenshot SHA → `evidence/cloud-deployment/01-vercel-production-deployment.png` |
| 3 | **Cloud happy path, 14 screenshots** | 1 consenting Student + 1 Advisor, separate browser profiles | Follow [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) and [`happy-path/README.md`](../evidence/happy-path/README.md); fill in [`capture-log.md`](../evidence/happy-path/capture-log.md) |
| 4 | Identity login network screenshot | Student | [`student-identity-login/README.md`](../evidence/student-identity-login/README.md) step 02 (Response tab only, never Payload) |
| 5 | Server-side logs: Identity `/auth/login` + `/me`, Team 18 call, Team 19 request ID | Someone with Vercel log access | Vercel → Logs, filter by time/path; hide tokens/cookies |
| 6 | Job Board UI + DevTools screenshots | Student | [`job-board-api/README.md`](../evidence/job-board-api/README.md) |
| 7 | Negative-test screenshots | Student + a second demo advisor | [`security-privacy/README.md`](../evidence/security-privacy/README.md) |
| 8 | Human test record M1–M10 | Testers | [`manual-test-record.md`](../evidence/testing/manual-test-record.md) |
| 9 | Confirm git identities ↔ members; add non-commit work; fix repeated student ID in A5 roster | All members | [`development-process/README.md`](../evidence/development-process/README.md) |
| 10 | AI-use rows (one or more per member who used AI) | Each member | Same file, AI-use table |
| 11 | Decide on security gaps: claims access policy, advisor verification, privacy notice, security headers | Team, plus advisor/instructor if policy | Record decisions; change code only with the team's agreement |
| 12 | Find the real final-evaluation announcement/rubric | Any member | Add to `docs/`; re-map the report |
| 13 | Redeploy rehearsal (small text change → test → deploy → check) | Member with Vercel access | Do it before the evaluation; don't deploy during Team 19's window |
| 14 | Attendance and demo roles | All members | Confirm who presents which part of the demo script |
| 15 | Reply to Team 19 | Team | Draft in [`partner-reported-team19.md`](../evidence/cross-group-api/partner-reported-team19.md). Review it, then send it yourselves |

After 3–8: ask Claude Code to "update the manifest and README for the new screenshots".
