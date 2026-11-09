# Team 18 Job Board integration

Updated with the unified workspace: partner opportunities are now browsed inside the signed-in workspace, and students can create real Internly application records for `jobboard-<id>` listings. These records stay in our database for assigned-advisor review; no application is sent to Team 18. The old saved-only and browser-demo application screens have been removed. The public read adapter and legacy placement detail URLs remain supported. Earlier references below to saved listings or browser-demo applications describe the prior UI.

The opportunities explorer, overview catalogue and saved partner opportunities
load from Team 18's public demo API. All jobs are fictional. No partner
application, notification, employer, or webhook endpoint is used.

## Data flow

Browser → our `/api/jobs` adapter →
`https://team18-job-board-api.tawee-dev.workers.dev/api/jobs?status=open&work_type=Internship`.

Details use the public `/jobs/{id}` endpoint. Its response has a single
`data` object, rather than the list's `data` array. The observed detail response
omits `company_name`, so the adapter resolves it from the public list by job and
employer ID. English fields are preferred for display; Thai-only content remains displayable.
The list deliberately omits `lang`: the provider treats `lang=en` as a record
language filter and excludes bilingual jobs such as job 6.

The demo provider returns the entire matching list without pagination. Our
adapter filters and paginates that list, and supplies category options from all
visible internships. It also checks status, internship work type and expiry
locally. This approach should be revisited if Team 18 adds upstream pagination.

| Partner data | Our catalogue |
| --- | --- |
| `job_id` | `source_job_id`; stable UI ID `jobboard-<job_id>` |
| `company_name` | `company` |
| `location`, `province` | Combined `location` |
| `category` | Original category, without invented mappings |
| `salary_range` | `salary_text`, preserving ranges and negotiable text |
| `required_skills_en`, then `_th` | `required_skills` as original prose |
| Responsibilities, qualifications, benefits | English text with Thai fallback |
| Missing duration, deadline, or arrangement | Not specified |

Only a location exactly equal to Remote is interpreted as remote work. Other
arrangements remain unspecified because the API does not supply that field.
Skill prose is not represented as verified skill tags. `skills` remains empty.
Partner records are always marked `is_demo=true`. Expiry uses the Bangkok date;
a null deadline does not exclude a job. There is no AI ranking in this adapter.

## Endpoints and failures

`GET /api/jobs` accepts `q`, `location`, `category`, `work_mode`, `status`, `page`,
and `limit`. Search matches title, company, description and skill prose. Location
matches the combined district/province; category matches the provider's category.
The list retains the frontend's pagination envelope, including totals and next
page information. `meta.data_source` identifies Team 18 and `meta.categories`
provides the category options. `GET /api/jobs/{id}` accepts numeric partner IDs
or `jobboard-<id>`.

Requests have a ten-second timeout, use GET only, do not follow redirects, and
validate upstream response fields. Network errors, invalid responses and provider
failures become retryable 503 responses; the UI offers Retry. No local fixture
fallback is used. Unavailable/closed/expired/non-internship details return 404.
Invalid local IDs or filters return 400. Reads are uncached to reflect changes.

The existing `/api/placements` endpoints and UUID detail pages still use our
placements database, preserving Team 12's separate contract. Existing saved UUID
listings continue to resolve through those endpoints.

## Boundary for teammates

Applications, advisor decisions and progress reports are still browser demos.
This integration does not create placements or submit applications. A teammate
implementing real applications should retain `source=team18-job-board` and
`source_job_id` when linking an application to a partner job, and explicitly
implement the persistence and eligibility checks for that workflow. The
`jobboard-` prefix is a UI namespace, not a database placement UUID.

## Verification

Automated tests in `web/tests/job-board.test.ts` cover visibility, search,
pagination, rejected filters, detail/company mapping, missing fields, ineligible
jobs, invalid IDs, upstream 404 and provider failures. These tests use injected
HTTP responses and do not depend on partner uptime.

To check manually, start the app, open Opportunities, search Backend, filter
Chiang Rai / IT & Software, open Backend Developer Intern, and save it. Check
Saved listings and reopen its detail page. Confirm fictional-data labels and
unchanged salary ranges. The raw normalized responses are `/api/jobs` and
`/api/jobs/6`. The existing `/api/placements` catalogue should still work when
its own database is configured.

On 9 November 2026, a live read-only adapter check returned HTTP 200 for the
Backend / Chiang Rai search and job 6 detail, including the resolved employer
Siam TechWorks Co., Ltd. and original salary `12,000-15,000 THB`. The full
regression suite passed (29 tests, including 11 new Job Board tests), and the
production build passed. These checks do not verify a hosted deployment.
