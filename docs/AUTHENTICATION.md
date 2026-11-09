# Internly authentication

Access policy update: at the user's request, both Integration activity and Student identity now accept any valid signed-in Internly account. No administrator switch or operator-token input is required. Identity claims still depend on provider consent and the service key. Earlier administrator-only descriptions below are superseded by this policy. A typed student ID does not establish account ownership; this is a shared integration demonstration, not a verified self-service student profile.

Implemented locally on 9 November 2026. This change has not been deployed.

## Test locally

From `web`, run `npm install`, then `npm run auth:setup`, then `npm run dev -- --webpack --hostname 127.0.0.1 --port 3001`.

Open http://127.0.0.1:3001/sign-in. Create an account for student access. To test administrator features, use the credentials in the private, git-ignored `web/.env.auth-admin.local`. The setup command creates that administrator only once and does not reset or promote existing accounts. Do not share that credentials file with partner groups.

The profile menu provides Sign out. Guests can browse public opportunities. The existing application and progress-report workflows remain clearly marked browser demos; their browser storage is now separated by account ID. Authentication does not make these demos real application submissions.

## Workflow

1. A student creates an Internly account with name, email and a password of at least 12 characters.
2. Better Auth hashes the password and stores account and session records in the local SQLite database at `web/.data/auth.sqlite`.
3. Sign-in sets an HttpOnly, SameSite=Lax session cookie, with Secure enabled for HTTPS. Sessions expire after seven days and are checked against the database.
4. Students have the `student` role. The server does not accept a role supplied in registration or profile updates. Only trusted administrator provisioning can grant `admin` access.
5. Administrators can open Integration activity and Student identity. The browser sends its session cookie automatically; there is no operator-token input. The backend enforces the role on every protected request, including requests made outside the UI.
6. Sign-out revokes that session. The previous cookie cannot authorize another request.

Student Identity remains separate: Internly's backend attaches the private Identity service API key when an administrator requests consented claims. That key is never placed in the browser. Internly login does not grant Identity consent, establish ownership of a typed student ID, or replace the provider service key. The configured service is currently labeled Maintenance; its key must match the service for which the student granted consent. Authentication does not change that registration.

The existing `INTEGRATION_ADMIN_TOKEN` remains supported for explicit server-to-server scripts. It is not an account password or a login cookie and is not requested by the UI.

## Deployment preparation

Local authentication is ready for testing. Production needs a persistent PostgreSQL database configured through server-only `AUTH_DATABASE_URL`, `AUTH_DB_MODE=postgres`, a new strong `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` set to the exact HTTPS site origin. The PostgreSQL connection currently uses the bundled Supabase CA. Use a dedicated database/role, apply Better Auth migrations and provision the administrator through a trusted server-side process before deploying. Do not copy the local SQLite database or local administrator credentials to Vercel. SQLite mode deliberately refuses to run on Vercel.

Email verification and email password recovery are not configured. An email address is an account identifier, not proof of verified student status. Add a mail provider and verified-email policy before relying on email ownership. No Student Identity single sign-on has been implemented.

## Validation

`npm test` covers real database-backed registration, password sign-in, role escalation rejection, administrator authorization, origin checks and sign-out revocation, alongside existing API tests. `npm run typecheck` checks TypeScript. Live smoke tests additionally exercise the running Next.js server and existing Supabase activity database.
