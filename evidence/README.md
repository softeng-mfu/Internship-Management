# Team 17 Internly: final-evaluation evidence

Index of all evidence. Machine-readable list: [`manifest.json`](manifest.json) (47 items: **14 VERIFIED, 1 PARTNER-REPORTED, 32 PENDING**, as of 2026-11-10 00:45 Bangkok).

**Rubric unavailable.** The official final-evaluation announcement was not available when this index was prepared, so the evidence is grouped by the 7 priority areas in [`docs/Handover.md`](../docs/Handover.md) and no weights are given. Replace this mapping when the rubric is found.

**No screenshots have been captured yet.** Screenshots below are listed as PENDING with the exact filename to use. Image links will be added only when the files exist.

## Status meanings

- **VERIFIED**: directly observed in this session (live request, test run or source inspection).
- **PARTNER-REPORTED**: another team's evidence that we haven't matched with our own logs yet.
- **LOCAL SIMULATION**: done on a local machine, not the cloud. (None at the moment.)
- **PENDING**: still to be captured. The folder README says who captures it and how.

## 1. System completion and cloud deployment → [`cloud-deployment/`](cloud-deployment/README.md)

- VERIFIED: all 9 required routes respond on https://team17-internship.vercel.app. The four that were 404 on 9 Nov now work: protected ones redirect to sign-in or return 401. See [routes recheck](../docs/evidence/2026-11-10-routes-recheck.txt).
- PENDING: Vercel screenshot showing the **deployed commit** (currently unknown) and hosted-DB configuration.

## 2. Complete student/advisor happy path → [`happy-path/`](happy-path/README.md)

- PENDING: all 14 screenshots. They need a real student (own Identity password) and an advisor, in separate browser profiles. **The cloud happy path has not been observed yet.**

## 3. Cross-group API integration → [`cross-group-api/`](cross-group-api/README.md), [`job-board-api/`](job-board-api/README.md)

- VERIFIED: our deployed backend consumes Team 19's status API ([response](cross-group-api/2026-11-10-partner-status-response.json)).
- VERIFIED: our deployed `/api/jobs` serves 12 Team 18 Job Board listings ([list](job-board-api/2026-11-10-list-response.json), [detail](job-board-api/2026-11-10-detail-response.json)).
- PARTNER-REPORTED: Team 19 consumes our `/api/placements` ([details](cross-group-api/partner-reported-team19.md)).
- PENDING: UI/DevTools screenshots and Vercel log correlation.

## 4. Development process, contributions, AI use → [`development-process/`](development-process/README.md)

- VERIFIED: commits per git identity. Identity mapping still needs team confirmation.
- PENDING: teammates' AI-use rows; non-commit contributions.

## 5. Security and privacy → [`security-privacy/`](security-privacy/README.md), [`student-identity-login/`](student-identity-login/README.md)

- VERIFIED (source + tests): hashing, sessions, origin checks, RBAC/ownership, duplicate/stale protection, Identity login design ([source reference](student-identity-login/source-reference.md)).
- Open gaps: broad claims access, unverified advisor registration, no privacy notice/retention, missing CSP/X-Frame-Options/X-Content-Type-Options.
- PENDING: negative-test screenshots; Identity login network/log screenshots.

## 6. Testing → [`testing/`](testing/README.md)

- VERIFIED (LOCAL): 35/35 tests, typecheck, build, `npm audit` 0. Outputs: [tests](../docs/evidence/2026-11-10-tests.txt), [build](../docs/evidence/2026-11-10-build.txt), [audit](../docs/evidence/2026-11-10-audit.txt).
- PENDING: [human test record](testing/manual-test-record.md).

## 7. Code understanding, demo and redeploy readiness

- See [`../submission/DEMO_SCRIPT.md`](../submission/DEMO_SCRIPT.md) and the source walkthrough in [`../docs/FINAL_EVALUATION_HANDOVER.md`](../docs/FINAL_EVALUATION_HANDOVER.md).
- PENDING: redeploy rehearsal; each member able to explain their part.

## Supplemental (historical A5) → [`supplemental-a5/`](supplemental-a5/README.md)

## Historical captures (unchanged)

[`2026-11-09-readiness.json`](../docs/evidence/2026-11-09-readiness.json), [`2026-11-09-tests.txt`](../docs/evidence/2026-11-09-tests.txt), [`2026-11-09-build.txt`](../docs/evidence/2026-11-09-build.txt).

## Folder layout

`docs/evidence/` holds the raw dated captures (old and new). `evidence/` (this folder) holds the index, manifest, per-area notes and, later, screenshots. `docs/handover/` keeps the partner API contract files at their existing paths, because partners already link to them.
