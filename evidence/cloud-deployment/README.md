# Cloud deployment evidence

## VERIFIED: public route recheck (CLOUD, 2026-11-09T17:32:34Z = 2026-11-10 00:32 Bangkok)

Full results: [`../../docs/evidence/2026-11-10-routes-recheck.txt`](../../docs/evidence/2026-11-10-routes-recheck.txt) and [`.json`](../../docs/evidence/2026-11-10-routes-recheck.json).

| Route | 2026-11-09 audit | Now | Meaning |
|---|---|---|---|
| `/`, `/sign-in`, `/api/placements`, `/api/integration/status` | 200 | 200 | unchanged |
| `/api/jobs` | **404** | **200** | now deployed |
| `/workspace` | **404** | **307 → /sign-in** | now deployed; correctly protected |
| `/advisor` | **404** | **307 → /sign-in** | now deployed; correctly protected |
| `/api/workspace` | **404** | **401** | now deployed; correctly protected |
| `/api/auth/get-session` | 200 | 200 (`null`) | does not prove login works |

**Deployed commit: UNKNOWN.** There are no GitHub deployment records, no Vercel CLI access and no version endpoint. Main HEAD is `754ad2a`; earlier work reported runtime `64e6b69`.

## PENDING

| File | Who | What |
|---|---|---|
| `01-vercel-production-deployment.png` | Someone with Vercel access | Vercel → Deployments → the Production deployment showing its **commit SHA**, time and "Ready". Hide env values |
| `02-public-site.png` | Anyone | https://team17-internship.vercel.app home page with the address bar |
| `03-hosted-db-config.png` | Someone with Vercel access | Vercel → Settings → Environment Variables showing **names only** (`AUTH_DB_MODE=postgres` etc.), values hidden. This proves we use PostgreSQL in production, not local files |
