# Happy-path screenshots (PENDING)

**Status: all 14 screenshots PENDING.** No screenshot in this folder has been captured yet. An AI coding session cannot do this, because it needs a real student logging in with their own Identity password and a real advisor. Do not add placeholder images.

Sequence: **Student Identity login → student requests advisor → advisor accepts → student applies → advisor approves → student submits weekly report → advisor gives feedback → student reads feedback.**

Environment: **CLOUD**, https://team17-internship.vercel.app. If you can only do it locally, prefix every filename with `LOCAL-` and leave the cloud entries PENDING.

## Before you start

- **Student**: a consenting student with their own Student Identity account. They type their own password. Nobody else sees it.
- **Advisor**: an advisor account created through *Advisor login → Create advisor account* on the cloud site. Use a clearly labelled demo name, for example `Demo Advisor (Team 17)`.
- Two **separate browser profiles** (for example Chrome profile "Student" and Edge, or one normal window plus one private window in a different browser). Tabs in one profile share cookies and will mix up the roles.
- The student must not already have an accepted advisor or a report for the same application/week. Otherwise use a fresh Job Board opportunity. **Never** reset or edit database records to make the flow work.
- Turn off password-manager autofill pop-ups before capturing.

For every screenshot, write a row in [`capture-log.md`](capture-log.md): UTC time, Bangkok time, role, exact URL, safe record ID, result.

## Shots to capture

| # | Filename | Who | URL | What must be visible |
|---|---|---|---|---|
| 01 | `01-student-identity-login.png` | Student | `/sign-in` → Student login | Login form with **password hidden (dots)**, address bar, Student tab selected |
| 02 | `02-student-workspace.png` | Student | `/workspace` | Logged-in Student workspace with the student's name/role. Address bar shows `/workspace` |
| 03 | `03-advisor-directory.png` | Student | `/workspace` → Advisors | Demo advisor in the list and the introduction/request form |
| 04 | `04-student-request-pending.png` | Student | `/workspace` → Advisors | The request just sent, status **pending** |
| 05 | `05-advisor-request-received.png` | Advisor | `/advisor` → Students | The same request (same student name + intro text) |
| 06 | `06-advisor-accepted.png` | Advisor | `/advisor` → Students | Student now in the assigned list. Then refresh the Student profile and check that the advisor's name shows there too (note it in the log) |
| 07 | `07-job-board-opportunity.png` | Student | `/workspace` → Opportunities, or `/opportunities/jobboard-<id>` | The chosen Team 18 listing, with its **sample/demo label visible** |
| 08 | `08-student-application-submitted.png` | Student | `/workspace` → Applications | The application with the same title/company, status **submitted** |
| 09 | `09-advisor-application-approved.png` | Advisor | `/advisor` → Applications | Same application, status **approved**, review note visible |
| 10 | `10-student-approval-visible.png` | Student | `/workspace` → Applications (after refresh) | **Approved** status + advisor note. Progress report action is now available |
| 11 | `11-student-report-submitted.png` | Student | `/workspace` → Progress reports | Report for that application, with week number and content |
| 12 | `12-advisor-report-feedback.png` | Advisor | `/advisor` → Progress reports | Feedback saved on that same report |
| 13 | `13-student-feedback-visible.png` | Student | `/workspace` → Progress reports (after refresh) | The advisor feedback on that report |
| 14 | `14-persistence-after-relogin.png` | Student | Log out → log in again → `/workspace` | Application, report and feedback are all still there |

Capture **after** each action finishes loading, not while a spinner is showing.

## Redaction

Keep an unedited original privately. In the committed copy, blur only what's unnecessary: other students' rows, full student ID if the student doesn't consent, and email addresses. Never change statuses or text. Name the redacted file the same and add "sanitized" in the log.

## After capturing

Put the PNGs here, fill in `capture-log.md`, then ask Claude Code to "update the manifest and README for the new screenshots". It will switch the entries from PENDING to VERIFIED.
