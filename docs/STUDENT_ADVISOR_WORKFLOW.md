# Student and advisor workspaces

Implemented locally on 9 November 2026. These changes have not been pushed or deployed.

## Sign in

Open `/sign-in` and choose Student login or Advisor login.

Students enter their Student Identity ID and password. The backend forwards credentials only to `https://student-identity.onrender.com/auth/login`, then verifies the returned token by fetching the authenticated `/me` profile. It checks the student role, matching student ID and expiry before issuing an Internly cookie session. The password and provider bearer token are never persisted or returned to the browser. The provider's authenticated student ID is stored on the Internly account; the provider email is not copied and existing email-based accounts are never silently linked. Student sessions expire at the earlier of the provider token expiry and 15 minutes. Provider suspension or revocation is rechecked at the next sign-in, not continuously during that short local session.

This is a credential-based server integration, not an OAuth redirect or shared-cookie SSO. The API key used for consented claims does not authenticate student login. Claims consent remains a separate provider control. The contract was inspected from the provider's current public frontend (`app.js` and `pages.js`): POST `/auth/login` returns `{token}`, and authenticated GET `/me` returns `student_id`, `first_name`, `last_name`. The adapter fails closed if this contract changes. Mocked valid-provider tests pass; a real successful student sign-in still needs the student's own credentials and participation.

Advisors use email/password credentials stored by the Internship backend. Choose Advisor login → Create advisor account, enter a name, email and matching passwords of at least 12 characters, and open the advisor view. Registration fixes the role to advisor, never administrator, and does not create student assignments or verify staff status. New advisors cannot read applications or reports until they accept the student's connection request or receive a trusted administrative assignment. Duplicate emails are rejected without linking, promoting or resetting existing accounts. Existing local student email/password accounts cannot sign in as advisors or access the real student workspace. Administrators can use the advisor sign-in form to manage all records.

## Connect a student and advisor

Student Identity login saves the verified student ID and name in our user table. There is no external bulk student directory: students appear after their first successful Identity login. Advisor registration saves the advisor's name and account locally. No Identity password or bearer token is saved.

1. The student opens **Advisors**, searches registered advisor names, and sends an introduction (1–2,000 characters).
2. The advisor opens **Students** to see pending requests. A request shares only the student's name, verified ID, introduction and request status; it does not grant access to applications or reports.
3. The advisor accepts or rejects the request. Acceptance saves the decision and assignment in one transaction. The student then appears in the advisor's assigned-student list, and the advisor's name appears in the student's workspace.
4. The assigned advisor reviews internship applications. Once an application is approved, the student submits weekly reports under **Progress reports**, and the advisor can read them and leave feedback. The student sees that feedback in their own reports.

A student can have one advisor and one pending request at a time. An advisor can accept many students. Students can cancel pending requests and choose another advisor after cancellation or rejection. Accepted connections cannot be cancelled or replaced through this flow; an existing assignment is never overwritten by accepting a stale request. Administrative reassignment remains a trusted setup operation. Refresh the workspace to see another user's new requests, decisions or reports.

## Local setup and assignment

From `web`, run:

```powershell
npm run auth:setup
npm run advisor:setup
npm run dev -- --webpack --hostname localhost --port 3000
```

The advisor login is in the git-ignored `web/.env.advisor.local`. The setup never resets an existing account or promotes an account with another role.

For an optional administrative assignment after a real student first signs in:

```powershell
npm run advisor:setup -- 6731503070
```

Replace the example ID with the verified student's ID. This command is a trusted local backend operation. Browser users cannot change roles or bypass the request/acceptance flow. The default local advisor is `advisor@internly.local`. No student data is preloaded or fabricated.

To assign a student to a newly registered advisor, supply that advisor's email:

```powershell
npm run advisor:setup -- 6731503070 advisor@example.edu
```

The custom advisor account must already exist with the advisor role. This command does not create it or overwrite its password.

## Screens and permissions

| User | Workspace | Allowed actions |
| --- | --- | --- |
| Student | `/workspace`: overview, advisors, applications, progress reports | Find advisors; send/cancel own connection requests; submit an application to an available database opportunity; view own status and advisor notes; submit weekly reports for own approved internship; read feedback |
| Advisor | `/advisor`: overview, students, applications, progress reports | Accept/reject requests addressed to them; view assigned students only; filter their applications and reports; mark submitted applications under review, approved or rejected with a note; give/update report feedback |
| Administrator | `/advisor` | View and review all student records |
| Guest | Public opportunity catalogue | No private workspace data or writes |

Backend checks apply to every request. Assignment membership is checked in the SQL mutation itself. Version checks prevent stale reviews from overwriting newer decisions. Final approved/rejected applications cannot be changed from this review screen. Duplicate applications and duplicate reports for the same internship/week are rejected. Unknown or out-of-scope record IDs return a generic conflict rather than exposing another student's record.

Students now have one workspace with Overview, Advisors, Opportunities, Applications, Progress reports and Integrations. Opportunity browsing and the real application form use the same navigation and layout. Integration activity and Student Identity are combined under Integrations. The old browser-demo dashboard, sample application queue, sample progress-report flows, saved-only demo page and advisor preview have been removed. Opening the homepage while signed in redirects to the appropriate workspace; guests see only the public opportunity catalogue. Existing `?view=` links are redirected to matching workspace tabs. Opportunity details link directly to the selected application form, preserving that selection through student sign-in.

Database catalogue records marked `is_demo` are still explicitly labeled Sample listing. These are database fixtures used for testing the assignment, not fabricated application history. No database records were deleted as part of the navigation cleanup. Real submissions and reviews are stored in separate workspace tables and do not automatically send A5 integration webhooks; that notification workflow is not part of this change.

## Storage and production

Local data uses `web/.data/auth.sqlite`. Workspace tables are `internship_assignments`, `internship_connection_requests`, `internship_applications` and `internship_reports`, alongside Better Auth's users and sessions. The store and its access controls are tested against SQLite and PostgreSQL (PGlite).

For a later authorized deployment, migrate the new Better Auth fields (`studentId`, `authSource`) and the workspace tables in the private production auth schema before releasing code. `prepare-hosted-auth.ts` now includes the workspace migration. Apply the additive connection-request table and indexes with `workspaceStore(...).migrate()` before serving the updated workspace. Local advisor credentials must not be copied to production: provision a separate advisor account through a trusted server-side process and assign real students after their first verified sign-in. The local setup command deliberately refuses to operate on a hosted database.

The generic email registration endpoint is disabled; advisor registration uses the dedicated `/api/auth/sign-up/advisor` endpoint with role fixed by the server, origin checks and rate limiting. Advisor password reset UI, email/staff verification, provider OAuth federation and automatic assignment without student requests are not implemented.

## Verification

### Checking the two roles locally

Use separate browser profiles or a private window to test a student and advisor at the same time. Tabs in one browser profile share the same login cookie: signing in as an advisor also changes the active account in student tabs. The workspace reloads its data on window focus and redirects to the active role's workspace when necessary.

The full workflow is: student Identity login → advisor connection request → advisor acceptance → student internship application → advisor application approval → student weekly report → advisor feedback → student reads feedback. Submitting an application before connecting is allowed, but an advisor cannot review it until connected. A pending connection request alone does not expose applications or reports.

Students can browse advisors/opportunities, request or cancel a pending connection, submit their own applications, submit reports for their own approved internships, and read their own decisions and feedback. They cannot approve applications, write advisor feedback, see other students' records, or assign themselves directly.

Advisors can accept/reject requests addressed to them, view their assigned students, review those students' applications, and give/update report feedback. They cannot submit student applications/reports or access another advisor's students. Accepted/rejected internship decisions are final in the current review screen. One student has one advisor; one advisor may have many students.

If the development overlay reports `<body>` attributes named `data-new-gr-c-s-check-loaded` or `data-gr-ext-installed`, those attributes were added by the Grammarly extension before React hydration. The root body tolerates this attribute mismatch using `suppressHydrationWarning`; descendant components still receive normal hydration checks.

`npm test` includes SQLite/PostgreSQL connection requests, rejection/cancellation, transactional acceptance and rollback, one-advisor enforcement, request ownership and report sharing after acceptance, plus provider login/profile validation, student session expiry, credential non-persistence, role/identity tampering, origin rejection, workspace ownership, advisor assignment isolation, application transitions, stale versions and report feedback. Run `npx tsx scripts/smoke-advisor.ts` against the local server after setup to check real advisor login, API data, route protection and logout.
