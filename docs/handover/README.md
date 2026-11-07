# Internship Opportunities API Handover

Provider: Team 17 Internship Management
Consumer: Team 12 Campus Events and Clubs
Contract version: 1.0
Prepared: 7 November 2026, Thailand time

## Current readiness

The list and detail APIs are implemented and verified locally. The Opportunities,
Saved opportunities, overview recommendations, and shareable detail pages read
from the database. The local catalogue uses persistent PGlite PostgreSQL files
under web/.data/placements. This is a real database-backed API, with six fictional
demonstration listings marked is_demo=true. These are not genuine vacancies.

The new endpoints have NOT been deployed or tested by Team 12 yet. A localhost
address works only on Team 17's machine. Do not announce a production placements
URL as ready until it has been deployed and checked from outside that machine.
Application submission, advisor decisions, and weekly reports remain separate
browser demos. No student records, CVs, or private applications are exposed here.

## Connection details

| Item | Value |
| --- | --- |
| Local base URL | http://127.0.0.1:3001 |
| List endpoint | GET /api/placements |
| Detail endpoint | GET /api/placements/{id} |
| Human readable detail | /opportunities/{id} |
| Authentication | None for these two public read-only endpoints |
| Request body | None |
| Accept header | application/json recommended |
| Response encoding | JSON UTF-8 |
| CORS | Public origins allowed; no credentials needed |
| Caching | Cache-Control: no-store; responses represent current availability |
| Public HTTPS base URL | Pending Team 17 deployment or tunnel |

Do not give Team 12 a database password, service-role key, or the internal
INTEGRATION_ADMIN_TOKEN. Existing A5 endpoints have separate contracts.

## List query parameters

| Parameter | Default | Accepted values and behavior |
| --- | --- | --- |
| page | 1 | Integer 1 to 10000; one based |
| limit | 12 | Integer 1 to 50 |
| status | open | Only open is supported |
| q | omitted | Up to 100 characters; case-insensitive literal substring in title, company, description, or skills |
| location | omitted | Up to 100 characters; case-insensitive literal substring |
| category | omitted | Up to 60 characters; case-insensitive exact category match |
| work_mode | omitted | remote, hybrid, or on-site |

Filters combine with AND. Text filters are trimmed. Empty optional text filters
act as no filter; an explicit empty status is invalid. Unknown or repeated
parameters return 400. Page and limit must use positive decimal integer notation.
No wildcard matching, private status queries, or custom sort parameters exist.
Category examples in local fixtures are Design, Engineering, Marketing, and Data.

Results are sorted by application_deadline ascending, then id ascending. A record
is public only when it is published, its published_at time has arrived, its status
is open, and its deadline is today or later in Asia/Bangkok. Expiry occurs at the
start of the following Thailand calendar day. Closed, draft, archived, expired,
and future-publication records are excluded from both list and detail responses.

An empty search returns 200 with data=[] and total_pages=0. A page beyond the last
page returns 200 with data=[] while retaining the true total. There is no frozen
snapshot across requests; listings may change while a consumer paginates.

## Ready to run requests

PowerShell or Windows Command Prompt:

~~~powershell
curl.exe -i "http://127.0.0.1:3001/api/placements?status=open&page=1&limit=10"
curl.exe "http://127.0.0.1:3001/api/placements?q=React&work_mode=remote"
curl.exe "http://127.0.0.1:3001/api/placements/10000000-0000-4000-8000-000000000001"
~~~

POSIX shells can use curl instead of curl.exe. All URLs above are LOCAL examples.
Replace only the base URL with the agreed HTTPS origin for Team 12's test.

## Example list response

This is an actual local response captured on 2026-11-07T12:07:06.129Z.
Request: GET /api/placements?limit=1. IDs are stable; request IDs, timestamps,
deadlines, and counts should never be hardcoded by consumers.

~~~json
{
  "success": true,
  "data": [
    {
      "id": "10000000-0000-4000-8000-000000000001",
      "title": "Product Design Intern",
      "skills": [
        "Figma",
        "UI/UX",
        "Prototyping"
      ],
      "status": "open",
      "company": "Sample Studio",
      "is_demo": true,
      "category": "Design",
      "location": "Bangkok, Thailand",
      "work_mode": "hybrid",
      "updated_at": "2026-11-07T11:56:20.628Z",
      "description": "Practice user research and turn ideas into thoughtful, accessible prototypes with a design mentor.",
      "published_at": "2026-11-07T11:56:20.628Z",
      "allowance_thb": 12000,
      "duration_weeks": 12,
      "application_deadline": "2027-02-05",
      "details_url": "http://127.0.0.1:3001/opportunities/10000000-0000-4000-8000-000000000001"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 1,
    "total": 6,
    "total_pages": 6,
    "has_next": true
  },
  "meta": {
    "api_version": "1.0",
    "request_id": "74bf4ab0-fed6-4758-9dad-02667b40baa8",
    "timestamp": "2026-11-07T12:07:06.129Z",
    "data_source": "local-postgresql"
  }
}
~~~

## Field dictionary

| Field | Type | Meaning |
| --- | --- | --- |
| id | UUID string | Stable placement identifier; use to deduplicate |
| title | string | Opportunity title |
| company | string | Company or organizer name |
| description | string | Plain text description; do not treat as HTML |
| location | string | Display location, including Remote where relevant |
| category | string | Opportunity category |
| work_mode | string | remote, hybrid, or on-site |
| skills | string array | Skill tags |
| allowance_thb | integer or null | Monthly allowance in THB; null means unspecified |
| duration_weeks | integer | Internship duration in weeks |
| application_deadline | YYYY-MM-DD | Date in Thailand, not a workshop start time |
| status | string | Always open in public results |
| is_demo | boolean | True identifies a fictional demonstration record |
| published_at | ISO 8601 UTC timestamp | Publication time |
| updated_at | ISO 8601 UTC timestamp | Last update time; writers must maintain it |
| details_url | absolute HTTP or HTTPS URL | Link back to Team 17's human readable detail page |

The detail endpoint returns {success:true,data:PLACEMENT,meta:META}, with no
pagination object. It accepts no query parameters. It applies the same visibility
rules as the list endpoint and returns 404 for an existing record that is hidden.
Malformed UUIDs return 400. A details_url is not a registration or application API.

Pagination contains page, limit, total, total_pages, and has_next. Metadata contains
api_version, request_id, timestamp, and data_source. A local response identifies
data_source=local-postgresql; hosted PostgreSQL uses postgresql. Each response
also includes X-Request-Id and exposes that header to browser clients.

## Error handling

| HTTP | Code | Consumer action |
| --- | --- | --- |
| 400 | INVALID_QUERY | Fix unsupported, repeated, or malformed query parameters; do not blindly retry |
| 400 | INVALID_ID | Supply a valid UUID |
| 404 | PLACEMENT_NOT_FOUND | Hide the stale link or explain that it is unavailable |
| 503 | PLACEMENTS_UNAVAILABLE | Show a temporary-unavailable state; retry with backoff |

Error envelope: {success:false,error:{code,message,retryable},meta:{...}}.
Only 503 sets retryable=true. Storage connection details are never returned.
GET is the supported integration operation. OPTIONS returns 204 for CORS;
HEAD is framework supported. Unsupported write methods return 405 from Next.js,
whose body is not part of this JSON contract. This API does not create bookings,
registrations, applications, or callbacks. It does not publish webhooks.

## Team 12 integration steps

1. Agree that internship opportunities satisfy your discovery use case. These
   records are not scheduled career workshops and have no event start time.
2. Set one backend configuration value for the shared HTTPS base URL.
3. Fetch GET /api/placements?page=1&limit=10 with a bounded client timeout, for
   example 10 seconds. Check both HTTP status and the success field.
4. Display title, company, description, location, and application_deadline.
   Use the deadline label, not event date. Render strings as text.
5. Link users to details_url. Deduplicate using id; do not use titles as keys.
6. Clearly label is_demo=true records in a test environment. Genuine discovery
   content requires reviewed real listings or explicit agreement on demo-only use.
7. Follow pagination.has_next to request the next page. Refresh on user request
   or a modest agreed polling interval; do not poll continuously.
8. Handle empty results, 404, 503, and network timeout without breaking your app.
9. Keep the returned request_id, HTTP status, and UTC timestamp for evidence.
10. Send Team 17 the result and a screenshot showing URL, status, and response.

~~~javascript
const params = new URLSearchParams({ page: '1', limit: '10', status: 'open' });
const response = await fetch(BASE_URL + '/api/placements?' + params, {
  headers: { Accept: 'application/json' },
  signal: AbortSignal.timeout(10000)
});
const body = await response.json();
if (!response.ok || !body.success) {
  throw new Error(body.error?.code || 'PLACEMENTS_REQUEST_FAILED');
}
// body.data -> discovery cards; body.pagination -> next-page controls
~~~

## Team 17 local operations

From the repository root, enter web, install with npm ci, and configure
web/.env.local using web/.env.example. Set PLACEMENTS_DB_MODE=local and
PUBLIC_SITE_URL=http://127.0.0.1:3001. No database password is needed for the LOCAL
catalogue. Existing integration activity uses its own separate connection.

~~~powershell
cd web
npm ci
npm run placements:setup
npm test
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3001
~~~

Run setup while the server is stopped. It applies the new migration only if the
local table is missing and inserts six fixed-ID demo records with ON CONFLICT DO
NOTHING. Rerunning it does not overwrite edited records or extend their deadlines.
The initial fixtures expire 90 days after first setup. Local files survive server
restarts and are ignored by Git. Do not share or delete .data to hand over the API.

## Team 17 sharing and deployment

For a temporary coordinated test, use your approved HTTPS tunnel to local port
3001. Set PUBLIC_SITE_URL to the tunnel origin and restart the app so returned
details_url values point to that public origin. The tunnel and local server must
remain running. Do not send the localhost address to Team 12 as their base URL.
No tunnel has been opened by this implementation.

For a hosted release, first review and apply only the new migration
supabase/migrations/202611070001_public_placements.sql to the chosen PostgreSQL
database once, following the team's migration history. Existing A5 data is
independent. Do not reapply old migrations or reset the database. Add reviewed
placements through a trusted database operator; the local setup command does
not populate or modify hosted data. Published inserts require published_at and
an open deadline; maintain updated_at whenever editing a record.

Deploy Next.js with root directory web. Set PLACEMENTS_DB_MODE=postgres,
PLACEMENTS_DATABASE_URL to a private Supabase PostgreSQL connection string, and
PUBLIC_SITE_URL to the final HTTPS frontend origin. DATABASE_URL is a server-only
fallback if PLACEMENTS_DATABASE_URL is omitted. The supplied CA certificate is
used to verify TLS. Prefer a dedicated read-only database role with SELECT on
public.placements and a deliberately scoped RLS read policy; do not give these
credentials to consumers. Supabase's privileged postgres user can also read the
table, but should not be the long-term runtime identity. A session or transaction
pooler may be needed when hosting lacks direct IPv6 connectivity; prepared
statements are disabled in the hosted adapter. Never use local PGlite mode on
Vercel; local mode is explicitly rejected there.

Verify GET /api/placements from outside the development machine, verify a returned
details_url, then update the base_url in the Postman collection and complete the
joint test. Do not claim the new production endpoint is ready before these checks.

## Handover acceptance checklist

- [x] Database-backed local list and detail endpoints implemented.
- [x] Six fictional records stored locally and labeled is_demo=true.
- [x] Opportunities, saved listings, and shareable detail links use these APIs.
- [x] Automated tests cover visibility, filters, pagination, validation, errors,
  SQL-like input, RLS installation, and redaction; 15 tests passed on 7 November.
- [x] TypeScript production build passed; local HTTP 200, 400, and 404 verified.
- [x] Browser search, save, and detail navigation verified locally.
- [ ] Team 12 confirms the internship-listing contract meets its needs.
- [ ] Team 17 supplies reviewed data or both teams agree on demo-only content.
- [ ] Public HTTPS deployment or agreed temporary tunnel is verified.
- [ ] Team 12 successfully calls the list endpoint from its backend.
- [ ] Both teams retain matching request_id, timestamps, screenshots, and logs.
- [ ] Team 12 confirms links and field mapping work in its discovery interface.

This checklist records local completion only. Partner sign-off and production
availability remain pending. Tests here are not evidence of Team 12 participation.

## Files to exchange

- Team17-Team12-API-Handover.pdf: shareable handover guide.
- README.md: editable technical guide (this file).
- placements.postman_collection.json: importable requests with base_url and
  placement_id collection variables; no secrets.
- placements.openapi.json: machine-readable OpenAPI 3.1 contract.
- example-list.json and example-detail.json: actual captured local responses.

## Ready to send message

Hi Team 12, we have implemented a public read-only internship opportunities API
and verified it locally. The main endpoint is GET /api/placements, with an optional
GET /api/placements/{id} for details. It includes company, description, location,
deadline, and a details link, with filters and pagination. No authentication is
required. The current six records are fictional demonstration data. Please review
the attached contract and confirm this meets your discovery use case. We will
provide the verified HTTPS base URL and arrange a joint test before handover.
