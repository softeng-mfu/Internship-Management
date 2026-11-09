# Student and advisor workspaces

Implemented locally on 9 November 2026. These changes have not been pushed or deployed.

## Sign in

Open `/sign-in` and choose Student login or Advisor login.

Students enter their Student Identity ID and password. The backend forwards credentials only to `https://student-identity.onrender.com/auth/login`, then verifies the returned token by fetching the authenticated `/me` profile. It checks the student role, matching student ID and expiry before issuing an Internly cookie session. The password and provider bearer token are never persisted or returned to the browser. The provider's authenticated student ID is stored on the Internly account; the provider email is not copied and existing email-based accounts are never silently linked. Student sessions expire at the earlier of the provider token expiry and 15 minutes. Provider suspension or revocation is rechecked at the next sign-in, not continuously during that short local session.

This is a credential-based server integration, not an OAuth redirect or shared-cookie SSO. The API key used for consented claims does not authenticate student login. Claims consent remains a separate provider control. The contract was inspected from the provider's current public frontend (`app.js` and `pages.js`): POST `/auth/login` returns `{token}`, and authenticated GET `/me` returns `student_id`, `first_name`, `last_name`. The adapter fails closed if this contract changes. Mocked valid-provider tests pass; a real successful student sign-in still needs the student's own credentials and participation.

Advisors use email/password credentials stored by the Internship backend. Choose Advisor login → Create advisor account, enter a name, email and matching passwords of at least 12 characters, and open the advisor view. Registration fixes the role to advisor, never administrator, and does not create student assignments or verify staff status. New advisors cannot read or review any student records until assigned through the trusted backend setup. Duplicate emails are rejected without linking, promoting or resetting existing accounts. Existing local student email/password accounts cannot sign in as advisors or access the real student workspace. Administrators can use the advisor sign-in form to manage all records.

## Local setup and assignment

From `web`, run:

```powershell
npm run auth:setup
npm run advisor:setup
npm run dev -- --webpack --hostname 127.0.0.1 --port 3001
```

The advisor login is in the git-ignored `web/.env.advisor.local`. The setup never resets an existing account or promotes an account with another role.

After a real student first signs in, assign that student to the local advisor:

```powershell
npm run advisor:setup -- 6731503070
```

Replace the example ID with the verified student's ID. Assignment is a trusted local backend operation; students and advisors cannot change their own role or assignments through browser requests. The default local advisor is `advisor@internly.local`. No student data is preloaded or fabricated.

To assign a student to a newly registered advisor, supply that advisor's email:

```powershell
npm run advisor:setup -- 6731503070 advisor@example.edu
```

The custom advisor account must already exist with the advisor role. This command does not create it or overwrite its password.

## Screens and permissions

| User | Workspace | Allowed actions |
| --- | --- | --- |
| Student | `/workspace`: overview, applications, progress reports | Submit an application to an available database opportunity; view own status and advisor notes; submit weekly reports for own approved internship; read feedback |
| Advisor | `/advisor`: overview, students, applications, progress reports | View assigned students only; filter their applications and reports; mark submitted applications under review, approved or rejected with a note; give/update report feedback |
| Administrator | `/advisor` | View and review all student records |
| Guest | Public opportunity catalogue | No private workspace data or writes |

Backend checks apply to every request. Assignment membership is checked in the SQL mutation itself. Version checks prevent stale reviews from overwriting newer decisions. Final approved/rejected applications cannot be changed from this review screen. Duplicate applications and duplicate reports for the same internship/week are rejected. Unknown or out-of-scope record IDs return a generic conflict rather than exposing another student's record.

Students now have one workspace with Overview, Opportunities, Applications, Progress reports and Integrations. Opportunity browsing and the real application form use the same navigation and layout. Integration activity and Student Identity are combined under Integrations. The old browser-demo dashboard, sample application queue, sample progress-report flows, saved-only demo page and advisor preview have been removed. Opening the homepage while signed in redirects to the appropriate workspace; guests see only the public opportunity catalogue. Existing `?view=` links are redirected to matching workspace tabs. Opportunity details link directly to the selected application form, preserving that selection through student sign-in.

Database catalogue records marked `is_demo` are still explicitly labeled Sample listing. These are database fixtures used for testing the assignment, not fabricated application history. No database records were deleted as part of the navigation cleanup. Real submissions and reviews are stored in separate workspace tables and do not automatically send A5 integration webhooks; that notification workflow is not part of this change.

## Storage and production

Local data uses `web/.data/auth.sqlite`. Workspace tables are `internship_assignments`, `internship_applications` and `internship_reports`, alongside Better Auth's users and sessions. The store and its access controls are tested against SQLite and PostgreSQL (PGlite).

For a later authorized deployment, migrate the new Better Auth fields (`studentId`, `authSource`) and the workspace tables in the private production auth schema before releasing code. `prepare-hosted-auth.ts` now includes the workspace migration. Local advisor credentials must not be copied to production: provision a separate advisor account through a trusted server-side process and assign real students after their first verified sign-in. The local setup command deliberately refuses to operate on a hosted database.

The generic email registration endpoint is disabled; advisor registration uses the dedicated `/api/auth/sign-up/advisor` endpoint with role fixed by the server, origin checks and rate limiting. Advisor password reset UI, email/staff verification, provider OAuth federation and automated advisor assignment are not implemented.

## Verification

`npm test` includes provider login/profile validation, student session expiry, credential non-persistence, role/identity tampering, origin rejection, workspace ownership, advisor assignment isolation, application transitions, stale versions and report feedback. Run `npx tsx scripts/smoke-advisor.ts` against the local server after setup to check real advisor login, API data, route protection and logout.
