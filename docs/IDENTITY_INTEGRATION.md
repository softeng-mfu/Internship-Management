# Student Identity integration

Access policy update: Student identity now accepts any valid signed-in Internly account at the user's request. The route verifies the session and request origin; no administrator role or token input is required. Provider service-key and consent checks remain enforced. Earlier administrator-only descriptions below are superseded by this policy. Internly accounts are not bound to provider student IDs.

Implemented 9 November 2026. Local implementation; not deployed.

## Implemented flow

Sign in to Internly with an administrator account, then open Student identity in the sidebar and enter a ten-digit student ID. The browser sends POST /api/identity/claims with its HttpOnly session cookie and JSON {"studentId":"YOUR_STUDENT_ID"}. No operator token is entered in the UI. The backend verifies administrator access and the request origin, then alone attaches X-API-Key to GET https://student-identity.onrender.com/students/{studentId}/claims. Explicit operator bearer credentials remain supported for server scripts.

The upstream website's public app.js confirms a claims envelope containing claims.verified, claims.profileComplete, claims.skills, optional claims.name and missingFields, and issuedAt. The adapter validates that envelope, strips extra fields, bounds response bytes, rejects redirects, and applies a ten-second deadline through response reading. Provider errors and secrets are not echoed. Responses use private no-store caching. No claims are persisted or logged. Operator access is required; this is not a public student-directory proxy.

## Activation dependency

The supplied key and local service label refer to Maintenance. The screenshot shows consent for internship-service, which needs its matching key; changing the client label does not change a key's registration. Verify the key's registration privately with the Identity group. An earlier request was denied for lack of matching consent; later local server logs show successful claims requests. Availability depends on the provider's current key and consent state. Do not grant consent to the wrong recipient just to make a test pass.

After confirmation, set these server-only values in web/.env.local:

```text
IDENTITY_API_KEY=the privately supplied service key
IDENTITY_CLIENT_ID=the actual registered service identifier
IDENTITY_SERVICE_CONFIRMED=true
```

Restart the app. The student must personally sign in or register at Student Identity, open Consent and sharing, enable profile:read for the confirmed service, and save. They should not send their password to this application or to the team. A signed-in administrator can then test the claims request for that consenting student.

## Error contract

Errors use {success:false,error:{code,message,retryable}}.

| HTTP | Code | Meaning |
| --- | --- | --- |
| 401 | UNAUTHORIZED | Administrator session or explicit script token missing or invalid |
| 403 | FORBIDDEN | Signed-in account is not an administrator |
| 403 | INVALID_ORIGIN | Cookie-authenticated POST came from an untrusted origin |
| 503 | IDENTITY_SETUP_PENDING | Service registration or key is not confirmed/configured |
| 400 | INVALID_STUDENT_ID | Expected ten numeric digits |
| 403 | IDENTITY_CONSENT_REQUIRED | Provider denied access; verify consent, key scope and account status |
| 404 | IDENTITY_STUDENT_NOT_FOUND | Provider did not find this student |
| 502 | IDENTITY_KEY_REJECTED | Provider rejected service credentials |
| 502 | IDENTITY_INVALID_RESPONSE | Unexpected response shape, JSON, or size |
| 503 | IDENTITY_UNAVAILABLE | Network failure, timeout, or upstream service failure |

## Authentication is separate

Internly now has its own email/password authentication; see AUTHENTICATION.md. Provider claims access never creates an Internship session, changes roles, approves applications, or proves that the caller owns the requested student ID. The provider's login API has not been used as cross-service single sign-on. Never trust a decoded but unverified JWT or a typed student ID as authentication.

## Verification

Automated mocks cover operator authorization, disabled setup, invalid IDs, correct upstream key transport, field allowlisting, consent denial, missing students, invalid keys, malformed responses and network errors. A real success test requires the provider registration confirmation and a consenting student's participation. Production deployment is a separate step.
