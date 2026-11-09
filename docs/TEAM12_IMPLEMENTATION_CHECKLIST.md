# Team 12 implementation checklist

Updated 7 November 2026. Scope: public internship discovery, not applications or career-event scheduling.

## Complete locally

- [x] Add independent placements SQL migration without changing A5 tables.
- [x] Persist local PostgreSQL data with six fictional labeled listings.
- [x] Add an idempotent local setup command that never writes to a remote database.
- [x] Add public GET /api/placements with query filters and pagination.
- [x] Add public GET /api/placements/{id} with identical visibility rules.
- [x] Exclude drafts, archived, closed, expired, and future-publication records.
- [x] Validate UUIDs, pagination, text lengths, work modes, unknown and repeated parameters.
- [x] Use parameterized SQL, a public field allowlist, request IDs, and redacted errors.
- [x] Connect frontend opportunities, saved listings, and recommendations to the API.
- [x] Provide shareable /opportunities/{id} pages and loading, empty, and error states.
- [x] Verify browser search, saving, and detail navigation.
- [x] Pass 15 automated tests and the production build.
- [x] Capture actual local success examples.
- [x] Prepare technical handover, OpenAPI contract, and Postman collection.

## Before sharing with Team 12

- [ ] Team 12 confirms internship listings meet its discovery requirements.
- [ ] Agree whether the coordinated test uses labeled fictional data or reviewed real data.
- [ ] Supply a verified public HTTPS base URL by deployment or agreed temporary tunnel.
- [ ] Set PUBLIC_SITE_URL to that same public frontend origin and verify details links.
- [ ] For hosted deployment, apply only the new migration once and use a read-only runtime role.
- [ ] Verify the two new API endpoints from outside the development machine.
- [ ] Replace the Postman collection base_url with the agreed HTTPS URL.
- [ ] Team 12 calls the endpoint from its backend and maps fields into discovery cards.
- [ ] Capture matching request IDs, HTTP statuses, UTC timestamps, screenshots, and hosting logs.
- [ ] Obtain Team 12 confirmation that discovery cards, pagination, and detail links work.

## Separate future project work

- [ ] Student authentication and role-based access.
- [ ] Real applications, advisor decisions, and weekly reports in the database.
- [ ] Placement administration and publication UI.
- [ ] Reliable status-event outbox delivery and retries.

These future items do not block the read-only Team 12 discovery integration.
