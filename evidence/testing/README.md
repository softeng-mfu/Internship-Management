# Testing evidence

## Automated (VERIFIED, LOCAL, 2026-11-10 00:30–00:33 Bangkok, Node v24.18.1, commit 754ad2a)

| Check | Result | Full output |
|---|---|---|
| `npm ci` + `placements:setup`, `auth:setup`, `advisor:setup` | OK (local-only; fresh private `.env.local`) | [`tests.txt`](../../docs/evidence/2026-11-10-tests.txt) (top) |
| `npx tsx --conditions=react-server --test --test-concurrency=1 tests/*.test.ts` | **35 tests, 35 pass, 0 fail, 0 skipped**, 26.2 s | [`tests.txt`](../../docs/evidence/2026-11-10-tests.txt) |
| `npm run typecheck` | **pass** (exit 0) | [`build.txt`](../../docs/evidence/2026-11-10-build.txt) |
| `npm run build -- --webpack` | **pass** (compiled in 16.7 s, exit 0) | [`build.txt`](../../docs/evidence/2026-11-10-build.txt) |
| `npm audit` | **0 vulnerabilities** | [`audit.txt`](../../docs/evidence/2026-11-10-audit.txt) |

This matches the 2026-11-09 audit (35/35). Tests use mocked providers and local PGlite/SQLite databases. They don't prove a real Identity login, a live webhook or the cloud deployment. A clean `npm audit` is not a penetration test.

Log lines like `ERROR [Better Auth]: Invalid origin` and `WARN Invalid password` in the test output are **expected**. They are negative tests passing, not failures.

## Human tests (PENDING)

Fill in [`manual-test-record.md`](manual-test-record.md) while doing the cloud happy path and the negative tests.
