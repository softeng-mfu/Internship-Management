# Vercel deployment preparation

Updated 7 November 2026.

## Existing deployment

- Existing site: https://team17-internship.vercel.app
- Its home page and /api/integration/status respond with HTTP 200.
- Its /api/placements still responds with HTTP 404. Do not share it as a working placements API yet.
- The site is serving the original A5 homepage, not the new Internly frontend.

## Release prepared

- Public placements list, detail API, and frontend are implemented.
- Updated vulnerable Next.js and Zod packages, and refreshed affected transitive dependencies.
- All 15 automated tests and the production build passed on Next.js 16.4.5.
- npm audit reports zero known vulnerabilities after the dependency updates.
- Added explicit CA certificate tracing for catalogue APIs, detail pages, and protected activity.
- Deployment upload excludes private environment files, local database files, build output, and generated artifacts.

## Hosted database prepared

- Applied the new placements migration to the existing Supabase database without modifying A5 tables.
- Inserted six fictional, clearly labeled demonstration listings with stable IDs.
- Created a separate SELECT-only runtime role for placements, with row-level security limiting it to published, open, unexpired listings.
- Verified the runtime role cannot read existing A5 status events.
- Verified TLS connectivity through the Mumbai transaction pooler on port 6543.
- Production catalogue environment values are kept in web/.env.deploy.local, which is ignored by Git and excluded from deployment source uploads.
- Do not share this private environment file with Team 12.

The one-time preparation command is `node scripts/prepare-hosted-placements.mjs` from web.
It reads existing administrator credentials privately from .env.local and copies only labeled demo records from the running local API. It creates the table only when missing and preserves existing records. It never replaces A5 data. It retains the reader credential for retries without rotating an existing role.

## Activation still required

- [ ] Authenticate Vercel for the account that owns the existing project, through the Codex Vercel integration or Vercel CLI login.
- [ ] Identify and link the exact existing Vercel project and team. Preserve its existing production environment values and domain.
- [ ] Confirm that its root directory is web.
- [ ] Add or update only PLACEMENTS_DB_MODE, PLACEMENTS_DATABASE_URL, and PUBLIC_SITE_URL from the private deployment environment file for production.
- [ ] Deploy the prepared source to that existing project.
- [ ] Verify the public home page, list API, filters, detail API, and returned details links.
- [ ] Confirm /api/integration/status still returns HTTP 200.
- [ ] Update the handover base URL and examples only after public verification.
- [ ] Coordinate Team 12's test and capture matching request IDs and confirmation.

No new Vercel project or temporary deployment has been created. The production site has not been changed by this preparation.
