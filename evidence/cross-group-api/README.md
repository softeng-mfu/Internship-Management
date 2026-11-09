# Cross-group API evidence

The final rubric was not available to this session (**rubric unavailable**). The earlier readiness audit says the announcement needs at least one real cross-group **API or webhook** integration. That claim could not be re-checked against the announcement here. We have three API integrations with evidence:

| Direction | Integration | Status | Evidence |
|---|---|---|---|
| **We consume** Team 19 (pod5-alumni-network) status API | Our deployed `GET /api/integration/partner-status` calls Team 19 and returns its status | **VERIFIED** (CLOUD, 2026-11-10 00:32 Bangkok) | [`2026-11-10-partner-status-response.json`](2026-11-10-partner-status-response.json); source `web/src/app/api/integration/partner-status/route.ts`, `web/src/lib/core.ts` |
| **We consume** Team 18 Job Board | `/api/jobs` | **VERIFIED** (CLOUD) | [`../job-board-api/`](../job-board-api/README.md) |
| **Team 19 consumes us** | Team 19's worker calls our `GET /api/placements` | **PARTNER-REPORTED** | [`partner-reported-team19.md`](partner-reported-team19.md) |

Our re-run of the exact query Team 19 reported (`?status=open&page=1&limit=5&category=Engineering`) returned 200 with 2 records, CORS `Access-Control-Allow-Origin: *` and request ID `3daeb7bb-1046-4d4d-a506-7cc5002ed35e`. See [`2026-11-10-placements-partner-query.json`](2026-11-10-placements-partner-query.json). This is our own request. It shows the contract still works, but it is not Team 19's request.

**Not implemented:** Team 19's offered `GET /api/mentors`. A search of `web/src` found no code calling it, so do not claim it.

## PENDING

- Find Team 19's request ID `a461ec05-1277-4b26-a79a-ed2b280d8ed7` (2026-11-09 07:13:44 UTC) in Vercel logs and send them a screenshot. Needs **Vercel log access**. Team 19 asked for this.
- Screenshot `01-partner-status-ui.png`: the Integrations tab in the workspace showing the Team 19 status call (Student, after login).
