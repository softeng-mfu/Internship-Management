# Internship Management Platform

Team 17 internship project and A5 integration service. This folder is the repository root.

```text
Internship_Management/
├── web/          Next.js application, tests and local configuration
├── supabase/     SQL migrations and verification queries
├── docs/         Assignment guides, PRDs, evidence and planning prompts
├── .gitignore
└── README.md
```

Start with the [implementation guide](docs/IMPLEMENTATION_A5.md). Record live test results in the [A5 evidence report](docs/A5-Team17-Integration-Evidence.md). The [database design](docs/Data_and_Query_Design.md) describes the broader project.

## Local development

```powershell
cd web
npm ci
npm run placements:setup
npm run dev
```

Configure `web/.env.local` using `web/.env.example`. Keep credentials private. Environment files, dependencies and build output are ignored by Git.

## Connect a new repository

The previous `origin` remote has been removed. Existing local commits remain.
Create an empty repository with your Git provider, then run from this folder:

```powershell
git remote add origin <new-repository-url>
git status
git add .
git commit -m "Organize project and add A5 integration"
git push -u origin HEAD
```

Review staged files before committing. These commands publish the existing history along with the new changes; they do not create a history-free repository.

## Frontend workspace

Guests see a searchable opportunity catalogue. Signed-in students use one workspace
for Overview, Opportunities, Applications, Progress reports and Integrations.
Advisors use the same layout with an additional assigned-students screen.
Student login uses the campus Identity service; advisor accounts use this backend.
Applications, reviews and reports are stored in the application database. The old
sample dashboard, saved-only demo page and advisor preview have been removed.
The catalogue includes fictional database fixtures labeled `is_demo=true` and
displayed as Sample listing. See [the workflow guide](docs/STUDENT_ADVISOR_WORKFLOW.md)
for local setup, advisor registration, assignments and production migration needs.

## Team 18 Job Board integration

The unified Opportunities tab reads Team 18's public Job Board through `GET /api/jobs`.
Partner details use `GET /api/jobs/{id}` and `/opportunities/jobboard-{id}`.
Open, unexpired internships are normalized with unknown salary, duration and deadline
fields preserved. No partner credentials or student records are sent to these read
endpoints. See [the Job Board integration guide](docs/JOB_BOARD_INTEGRATION.md).
Internly application submissions are stored in our workspace database and reviewed
by assigned advisors; they are not submitted to the external Job Board.

## Team 12 public opportunities API

See the [handover guide](docs/handover/README.md),
[OpenAPI contract](docs/handover/placements.openapi.json), and
[Postman collection](docs/handover/placements.postman_collection.json).

Configure `.env.local` inside `web` with `PLACEMENTS_DB_MODE=local` and
`PUBLIC_SITE_URL=http://127.0.0.1:3001`. Run the following from `web` while the
server is stopped for setup; no remote database is modified:

```powershell
npm run placements:setup
npm run dev -- --hostname 127.0.0.1 --port 3001
```

- `GET http://127.0.0.1:3001/api/placements`: public, filtered, paginated catalogue.
- `GET http://127.0.0.1:3001/api/placements/{id}`: public open placement details.
- `http://127.0.0.1:3001/?view=Opportunities`: frontend catalogue.
- `http://127.0.0.1:3001/opportunities/{id}`: shareable human-readable details.

The persistent local database is at `web/.data/placements`, ignored by Git.
Setup is idempotent and preserves edited fixtures. For hosted PostgreSQL, apply
the new placements migration once, configure `PLACEMENTS_DB_MODE=postgres` and
a server-only `PLACEMENTS_DATABASE_URL`, and set `PUBLIC_SITE_URL` to the actual
HTTPS frontend origin. Hosted read connections verify TLS. The public API exposes
only published, open, unexpired opportunities. Production handover remains pending.

### Live integration activity

The Integration activity section reads the existing A5 tables. Configure a
server-only `DATABASE_URL` in `web/.env.local`, and set an independent random
`INTEGRATION_ADMIN_TOKEN` of at least 32 characters for server scripts. Signed-in
users open Integrations → Activity using their existing session, without entering
an operator token. Student Identity is the second view in the same Integrations tab.
The activity endpoint returns only counts and selected
record metadata, excluding raw payloads and responses. PostgreSQL connections
verify TLS using `web/certs/supabase-ca.crt` and use read-only sessions.
The supplied certificate is Supabase's public root CA, downloaded from
https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt.

The existing webhook/write routes continue using Supabase's API and still need
`SUPABASE_SERVICE_ROLE_KEY` and their respective secrets. Direct database
configuration does not replace those settings. No tables are created or seeded
by the frontend.
