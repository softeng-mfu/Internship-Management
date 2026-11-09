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

The homepage contains the Internly student dashboard, searchable opportunities,
saved listings, an application tracker, weekly reports, and an advisor preview.
Opportunities, recommendations, and shareable detail pages read from the placements
API. Local PostgreSQL contains six fictional records labeled `is_demo=true`.
Saved IDs persist in the browser. Application, advisor, and weekly-report actions
remain clearly labeled browser demos and do not write to Supabase.

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
`INTEGRATION_ADMIN_TOKEN` of at least 32 characters. Open Integration activity
and enter that operator token. It is held in memory, not browser storage.
The endpoint requires bearer authorization and returns only counts and selected
record metadata, excluding raw payloads and responses. PostgreSQL connections
verify TLS using `web/certs/supabase-ca.crt` and use read-only sessions.
The supplied certificate is Supabase's public root CA, downloaded from
https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt.

The existing webhook/write routes continue using Supabase's API and still need
`SUPABASE_SERVICE_ROLE_KEY` and their respective secrets. Direct database
configuration does not replace those settings. No tables are created or seeded
by the frontend.
