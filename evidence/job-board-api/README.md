# Team 18 Job Board API evidence

Our backend reads Team 18's public Job Board API and shows it in our opportunity explorer. Applications made in Internly for `jobboard-<id>` are **stored in our system only**. They are not sent to Team 18.

## Captured now (VERIFIED, CLOUD, curl, unauthenticated)

| File | What it shows |
|---|---|
| [`2026-11-10-list-response.json`](2026-11-10-list-response.json) | `GET https://team17-internship.vercel.app/api/jobs` → 200, 12 records, `data_source: team18-job-board`, request ID `012affb3-c361-460f-9ccd-74de4fcef976`, 2026-11-09T17:32:40Z (00:32 Bangkok, 10 Nov). Trimmed to 3 records. |
| [`2026-11-10-detail-response.json`](2026-11-10-detail-response.json) | `GET /api/jobs/jobboard-226` → 200, full detail record. |
| [`2026-11-10-provider-availability.txt`](2026-11-10-provider-availability.txt) | A **separate** direct call from this machine to Team 18's provider URL → 200. This is an availability test, **not** proof of our backend's call. |

These were made with curl, not through the browser UI.

## Still PENDING (screenshots)

| File | Who | How |
|---|---|---|
| `01-listings-ui.png` | Student | `/workspace` → Opportunities, showing Team 18 listings with their demo label |
| `02-list-request-response.png` | Student | DevTools → Network while changing a filter. Show the `/api/jobs?...` request URL, status 200, and the JSON Preview |
| `03-detail-request-response.png` | Student | Open one listing. If the detail page is rendered on the server (no browser request appears), write that in the manifest and use `2026-11-10-detail-response.json` instead |
| `04-provider-call.png` | Someone with **Vercel log access** | Vercel runtime log showing our server calling `team18-job-board-api.tawee-dev.workers.dev/api/jobs` at the same time as 02. If no such log exists, say so and don't invent one |

Source: `web/src/lib/job-board.ts` (provider URL at line 6, 10-second timeout, redirects refused), `web/src/app/api/jobs/route.ts`, `web/src/app/api/jobs/[id]/route.ts`, tests in `web/tests/job-board.test.ts` (mocked provider).
