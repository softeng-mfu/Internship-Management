# Student Identity login: source reference

Status: **VERIFIED by source inspection** on 2026-11-10 at commit `754ad2a`. This shows how the code is written. It does **not** prove that a real student login succeeded in the cloud.

| Step | Where |
|---|---|
| Browser posts the student ID and password to our backend | `POST /api/auth/sign-in/student-identity`, handled by the auth plugin in `web/src/lib/student-login.ts` |
| Backend forwards the credentials only to the Identity service `/auth/login` | `web/src/lib/student-login.ts` (around line 51) |
| Returned token is only decoded to check `role: "student"` and `exp`; decoding grants nothing by itself | `web/src/lib/student-login.ts` (around lines 58–60) |
| Backend calls authenticated `/me` and requires `student_id` to match the submitted ID (10 digits) | `web/src/lib/student-login.ts` (around lines 68–78) |
| Session expiry = the earlier of the provider token expiry and 15 minutes | `web/src/lib/student-login.ts` (around line 88) |
| Password and provider token are not stored or returned to the browser | `web/src/lib/student-login.ts`; documented in `docs/STUDENT_ADVISOR_WORKFLOW.md` |
| Automated tests (mocked provider) | `web/tests/student-login.test.ts`, `web/tests/identity.test.ts`. They pass (see `docs/evidence/2026-11-10-tests.txt`), but they use a **mocked** provider |

Limitation: a real successful Identity login has not been observed in this session.
