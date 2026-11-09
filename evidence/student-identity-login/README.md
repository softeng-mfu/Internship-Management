# Student Identity login evidence

| File | Status | Who must capture |
|---|---|---|
| `01-login-form.png` | PENDING | Student (can reuse happy-path shot 01 if it's the same event) |
| `02-login-network-success.png` | PENDING | Student, with DevTools open |
| `03-authenticated-student.png` | PENDING | Student (can reuse happy-path shot 02) |
| `04-provider-verification.png` | PENDING | Someone with **Vercel runtime-log access** |
| [`source-reference.md`](source-reference.md) | VERIFIED (source inspected 2026-11-10) | done |

If 01/03 are the same event as the happy-path shots, don't take duplicates. Note "see `../happy-path/01-student-identity-login.png`" in the manifest instead.

## How to capture 02-login-network-success.png

1. In the Student browser profile, open DevTools (F12) → **Network**, tick *Preserve log*.
2. Go to https://team17-internship.vercel.app/sign-in → Student login, and the student types their own ID and password.
3. Click the `POST /api/auth/sign-in/student-identity` request.
4. Show the **Headers** (URL + status 200) and the **Response/Preview** tab. **Do NOT show the Payload tab**, because it contains the password.
5. Make sure no `Set-Cookie`, cookie or token value is visible. Crop or blur it if it is.

## How to capture 04-provider-verification.png

Browser DevTools cannot see our server calling the Identity service. Someone with access to the Vercel project should:

1. Open Vercel → project → **Logs**, filtered to the time of shot 02 and the path `/api/auth/sign-in/student-identity`.
2. Screenshot the log line(s) with timestamp and status, showing the server reached `/auth/login` and `/me`.
3. If the current code doesn't log those calls, write **"no server-side log available"** in the manifest. Don't add logging that prints passwords, bearer tokens, cookies or the raw profile. Any temporary log line must be reviewed and removed afterwards.

Login (password → our session) and *claims consent* (`profile:read` via API key) are different things. Don't change consent settings to get a login screenshot.
