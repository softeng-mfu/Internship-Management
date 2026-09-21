# Run the A5 integration
## What is implemented
Next.js routes live in `web/`. Three standalone Supabase tables use the `a5_` prefix. This is an integration demonstration: event creation records a simulated internship status event with `data.demo=true`; it does not approve a real application. No frontend workflow is required.

| Method | Path | Access |
|---|---|---|
| GET | /api/integration/status | Public; request ID and timestamp logged to hosting console |
| GET | /api/integration/partner-status | Public; fixed configured partner URL, 3-second deadline |
| POST | /api/webhooks/partner | X-Webhook-Secret matches our WEBHOOK_SECRET |
| POST | /api/integration/status-events | Authorization: Bearer INTEGRATION_ADMIN_TOKEN; Idempotency-Key required |

## 1. Configure locally
Run from the repository root:
```powershell
cd web
npm ci
Copy-Item .env.example .env.local
```
Fill `.env.local` in your editor:
- Supabase project URL and server-only service-role key.
- A random WEBHOOK_SECRET for our receiver, shared securely with Alumni.
- Alumni's PARTNER_WEBHOOK_SECRET, used as the HMAC-SHA256 key for requests to their receiver.
- A separate INTEGRATION_ADMIN_TOKEN for your own operator requests.
- Confirm PARTNER_TEAM matches the incoming event's source exactly.
Generate each of the three secrets independently, with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
Do not put tokens in git, screenshots or the evidence report. No variables use NEXT_PUBLIC_.

Status and partner-status can run before Supabase is configured. Other routes fail clearly if configuration is missing. Never paste credentials into the chat.

## 2. Apply the database migration
In your own Supabase project, open SQL Editor and run:
`supabase/migrations/202609200002_a5_integration.sql` (path relative to repository root).
Run once. It creates three tables, enables RLS, denies anon/authenticated access, and grants only service_role the RPC permissions.
This is the only supplied migration needed for A5; the domain migration mentioned in the existing design report is not present in this checkout.
No remote project has been changed by this implementation.

## 3. Run and verify
```powershell
npm test
npm run typecheck
npm run build
npm run dev
```
Visit http://localhost:3000/api/integration/status and /api/integration/partner-status.
Tests run the actual migration against embedded PostgreSQL (PGlite), plus timeout, parsing and validation checks. They are local tests, not evidence of partner participation.

## 4. Configure Postman
Create a local, private environment:
- base_url: http://localhost:3000
- admin_token: your INTEGRATION_ADMIN_TOKEN
- webhook_secret: your WEBHOOK_SECRET

Create requests:
1. GET {{base_url}}/api/integration/status
2. GET {{base_url}}/api/integration/partner-status
3. POST {{base_url}}/api/webhooks/partner with Content-Type application/json and X-Webhook-Secret {{webhook_secret}}
4. POST {{base_url}}/api/integration/status-events with Content-Type application/json, Authorization Bearer {{admin_token}}, Idempotency-Key a5-demo-001

Incoming webhook example (ask Alumni to send this with their actual source):
```json
{
  "event_id": "alumni-demo-001",
  "event_type": "partner.updated",
  "occurred_at": "2026-09-20T16:00:00Z",
  "source": "pod5-alumni-network",
  "data": { "resource_id": "alumni-demo-001", "status": "updated" }
}
```
Repeat with the wrong secret: expect 401, and no accepted receipt.
Repeat a valid event: expect duplicate=true, one stored receipt.
Same source/event ID with changed payload: expect 409.

Status-event example:
```json
{
  "application_id": "app_demo_001",
  "previous_status": "under_review",
  "current_status": "approved"
}
```
First call: 201 with idempotent_replay=false and delivery outcome.
Same key and body: 200 (or 202 while the first request runs), same event_id, idempotent_replay=true, no additional send.
Same key, different body: 409 IDEMPOTENCY_KEY_CONFLICT.
New key: new demonstration event. This does not override the real application's duplicate-application business rule.
Run `supabase/a5_verification.sql` to capture database evidence.

## 5. Understand delivery outcomes
- delivered: partner returned 2xx.
- failed: partner returned non-2xx.
- unknown: network timeout/failure; the partner may have accepted the event.
- sending: first request is running, or it crashed before recording completion.

The database commits the event reservation before sending. A replay never resends, including failed/unknown outcomes. A crash can leave sending indefinitely. This lab implementation makes at most one delivery attempt per key; it does NOT guarantee exactly-once delivery or reliable retries. Do not use a new key to blindly retry unknown outcomes. Check partner receipt logs first. A future outbox worker should retry the same event ID with partner deduplication.
Creation success and webhook delivery success are separate fields. Capture a delivered outcome for the sender proof.

## 6. Practice failure and recovery locally
In a second terminal, run:
```powershell
cd web
npm run mock-partner
```
Set PARTNER_API_URL in .env.local to http://127.0.0.1:4100/api/integration/status and start the app.
In the mock terminal type:
- ok: normal response.
- slow: a 10-second wait, consumer times out at about 3 seconds.
- error: HTTP 503.
- invalid: invalid JSON.
- ok: restore service.
Call partner-status after each change. During failure, status must continue returning 200. Recovery occurs on the next call with no app restart, configuration change or redeploy.
The mock is explicitly local practice; it is not real partner evidence.
For the final test, restore the Alumni URL before starting the test, coordinate a temporary failure on their test endpoint, then have them restore it. Capture failure and subsequent successful calls with timestamps on the same deployment.
Changing your URL and redeploying is NOT proof of automatic recovery.

## 7. Deploy and exchange evidence
Deploy the repository using Vercel with Root Directory `web`. Configure all environment variables. Ensure the partner can reach the production endpoint without Vercel preview authentication.
Share your base URL, GET /api/integration/status, POST /api/webhooks/partner and receiver secret securely.
Alumni's receiver requires `X-Webhook-Signature`, containing the lowercase hex HMAC-SHA256 digest of the exact raw request body. The shared secret is used as the UTF-8 HMAC key. The outgoing body is `{ "id": "<event id>", "type": "<event type>", "data": {} }`; the sender serializes it once and signs and transmits those same bytes.
Our incoming receiver remains a separate contract: `X-Webhook-Secret` with `event_id`, `event_type`, `occurred_at`, `source`, and `data`. Confirm this reciprocal contract with Alumni before their test send.
The partner owns the receiver secret for each direction. They only need to rotate an old secret if neither party has its original value; do not assume it must be rotated.
Ask the partner to call your endpoint and send the webhook; obtain their confirmation. No messages or webhooks were sent to the partner by this setup.

## Agent-safe endpoint design
POST /api/integration/status-events creates one demo event. Operator authorization is required. The endpoint never deletes resources or approves real applications. Idempotency keys persist in Supabase and compare the normalized request JSON. Different data with an existing key is rejected. Concurrent claims are serialized by a unique constraint; only the inserting request sends. Errors are JSON with code, message and retryable. Replays return the original event and its current delivery outcome.

## Final submission
Complete A5-Team17-Integration-Evidence.md with real results, partner confirmation and screenshots. Keep local mock results labeled separately. Include reflection and the agent-safe design. Do not mark deployment or external tests as complete until they actually run.

References: [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers), [Supabase database functions](https://supabase.com/docs/guides/database/functions).
