# Happy-path capture log

Fill in one row per screenshot when you take it. Leave rows empty until then. Do not write passwords, tokens or cookies here.

Tested site: https://team17-internship.vercel.app · Deployed commit (if someone with Vercel access can see it): ________

Student label: Nyan Sint Zaw (6731503077, team member) · Advisor label: Aj John (advisor account) · Opportunity ID: jobboard-226 · Application ID: ________ · Report week: ____

| # | File | UTC time | Bangkok time | Role | Exact URL | Record ID | Result | Sanitized? | Captured by |
|---|---|---|---|---|---|---|---|---|---|
| 01 | 01-student-identity-login.png | | | Student | | | | | |
| 02 | 02-student-workspace.png | 2026-11-09 18:52 | 2026-11-10 01:52 | Student (Nyan Sint Zaw) | https://team17-internship.vercel.app/workspace (address bar not in capture) | student 6731503077 | Authenticated Student workspace; sidebar shows 'Student · 6731503077'; advisor Aj John; 0 applications | Yes (own record only) | Claude in Chrome, in the student's own signed-in session (student typed own password) |
| 03 | 03-advisor-directory.png | — | — | Student | — | — | Step completed 2026-11-10 (date on advisor screen) before capture began; screenshot NOT captured | — | — |
| 04 | 04-student-request-pending.png | — | — | Student | — | — | Step completed 2026-11-10 (date on advisor screen) before capture began; screenshot NOT captured | — | — |
| 05 | 05-advisor-request-received.png | — | — | Advisor | — | — | Step completed 2026-11-10 (date on advisor screen) before capture began; screenshot NOT captured | — | — |
| 06 | 06-advisor-accepted.png | 2026-11-09 18:44 | 2026-11-10 01:44 | Advisor (Aj John) | https://team17-internship.vercel.app/advisor?tab=students (address bar not in capture) | student 6731503077 | Request from Nyan Sint Zaw shows Accepted; Nyan listed under Assigned students (0 applications, 0 reports) | No: also shows teammate Nadi Zeya (6731503070); make a redacted copy if required | Claude in Chrome, in the advisor's own signed-in session |
| 07 | 07-job-board-opportunity.png | 2026-11-09 18:53 | 2026-11-10 01:53 | Student (Nyan Sint Zaw) | https://team17-internship.vercel.app/workspace?tab=opportunities (address bar not in capture) | jobboard-226 | Team 18 listing 'นักพัฒนา backend', Siam TechWorks Co., Ltd., labelled 'Sample listing' (first card) | Yes | Claude in Chrome, in the student's own signed-in session (student typed own password) |
| 08 | 08-student-application-submitted.png | 2026-11-09 18:54 | 2026-11-10 01:54 | Student (Nyan Sint Zaw) | https://team17-internship.vercel.app/workspace?tab=applications (address bar not in capture) | application for jobboard-226 (internal ID not shown) | 'นักพัฒนา backend' / Siam TechWorks, dated 11/10/2026, status Submitted, demo-labelled note | Yes | Claude in Chrome, in the student's own signed-in session (student typed own password) |
| 09 | 09-advisor-application-approved.png | | | Advisor | | | | | |
| 10 | 10-student-approval-visible.png | | | Student | | | | | |
| 11 | 11-student-report-submitted.png | | | Student | | | | | |
| 12 | 12-advisor-report-feedback.png | | | Advisor | | | | | |
| 13 | 13-student-feedback-visible.png | | | Student | | | | | |
| 14 | 14-persistence-after-relogin.png | | | Student | | | | | |

How login success was verified for shot 02: the student signed in themselves via Student login; /workspace (Student-only, redirects when signed out) loaded and the sidebar shows 'Nyan Sint Zaw · Student · 6731503077'. Note: steps 01-14 are done in ONE Chrome profile, switching roles by sign-out/sign-in, not two simultaneous profiles.
