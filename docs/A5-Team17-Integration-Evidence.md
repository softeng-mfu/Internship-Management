# A5 Team17 Integration Evidence

**Project:** Internship Management Platform  
**Report date:** September 21, 2026  
**Due:** September 22, 2026, 11:59 PM  
**Status:** Partial evidence report. Real partner handshake and coordinated outage testing remain pending.

## 1. Team information

| Member         | Student ID |
| -------------- | ---------- |
| Nadi Zeya      | 6731503070 |
| Than Htike Zaw | 6731503067 |
| Nyan Sint Zaw  | 6731503077 |
| Min Thein Kyaw | 6731503067 |

Names and IDs are retained as provided by the team, including the repeated ID.

Production base URL: https://team17-internship.vercel.app

The backend uses Next.js on Vercel and Supabase PostgreSQL. Partners should use the stable production domain; individual deployment URLs may require Vercel authentication.

## 2. Partner information

| Partner        | Public status endpoint                                                         | Webhook receiver                                                             |
| -------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Alumni Network | https://alumni-network-integration.phyo2lay.workers.dev/api/integration/status | https://alumni-network-integration.phyo2lay.workers.dev/api/webhooks/partner |

Alumni Network is the primary integration in this report. Its status endpoint has been consumed successfully. Mutual webhook tests are pending.

Alumni authentication uses HMAC-SHA256 over the exact raw request body with a receiver-owned shared secret and the `X-Webhook-Signature` header. Team 17's incoming receiver currently uses its separate receiver-owned secret in `X-Webhook-Secret`. Actual secrets, operator tokens and database keys are excluded from this report.

## 3. Evidence audit

| Assignment proof | Verified so far                                      | Still required                                                           |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| Consumer         | Production HTTP 200 response and stored consumer log | Response screenshot                                                      |
| Provider         | Public endpoint responds during our checks           | Alumni request, matching internal log, partner confirmation              |
| Webhook receiver | Local practice event stored with verified secret     | Real Alumni event and confirmation; deployed invalid-secret test capture |
| Webhook sender   | Local automated test passes                          | Real delivery payload, partner response and confirmation                 |
| Idempotency      | Local SQL and route tests pass                       | Two production requests, one stored resource and no second webhook       |
| Degradation      | Local timeout and recovery tests pass                | Coordinated partner failure and recovery evidence                        |

The team confirmed that Alumni participation and the real outage test have not happened yet. Local tests are not substituted for partner evidence.

## 4. Consumer proof

Our consumer endpoint:

```http
GET https://team17-internship.vercel.app/api/integration/partner-status
```

Partner URL:

```http
GET https://alumni-network-integration.phyo2lay.workers.dev/api/integration/status
```

The production endpoint returned **HTTP 200** with the following observed response:

```json
{
  "success": true,
  "requested_at": "2026-09-21T06:55:58.784Z",
  "data": {
    "partner_team": "pod5-alumni-network",
    "partner_service": "alumni-network-integration",
    "partner_status": "ok",
    "partner_version": "0.1"
  }
}
```

The request timestamp corresponds to 13:55:58.784 Thailand time. requested_at records when Team 17 started the consumer request.

A subsequent request is independently supported by this Supabase a5_integration_logs record. It is a separate call from the response above:

```json
{
  "id": 11,
  "action": "consumer_request",
  "details": {
    "status": 200,
    "success": true,
    "duration_ms": 125,
    "partner_url": "https://alumni-network-integration.phyo2lay.workers.dev/api/integration/status",
    "requested_at": "2026-09-21T06:56:13.248Z"
  },
  "created_at": "2026-09-21T06:56:13.373+00:00"
}
```

**Result:** Actual partner consumption is verified. The backend normalizes Alumni's flat response into our response envelope.

**Pending attachment:** Screenshot showing the production request URL, HTTP status and JSON timestamp. Match any new screenshot with its own request time.

## 5. Provider proof

Public endpoint:

```http
GET https://team17-internship.vercel.app/api/integration/status
```

Our verification returned **HTTP 200**:

```json
{
  "success": true,
  "request_id": "391ee822-71d7-4be0-8747-09e5f6788477",
  "data": {
    "team": "team17-internship-management",
    "service": "internship-management-integration",
    "status": "ok",
    "version": "0.1",
    "timestamp": "2026-09-21T06:40:11.351Z"
  }
}
```

This proves accessibility, but is not a confirmed Alumni request. The route writes provider_request records to Vercel runtime logs with request_id, timestamp, method, path and status.

**Pending:** Alumni calls this URL, supplies its response and timestamp, and confirms success. Attach the matching Vercel runtime log using the same request_id.

## 6. Webhook receiver proof

Endpoint:

```http
POST https://team17-internship.vercel.app/api/webhooks/partner
Content-Type: application/json
X-Webhook-Secret: [REDACTED]
```

### Stored local practice event

The connected Supabase project contains this payload:

```json
{
  "event_id": "alumni-local-test-001",
  "event_type": "partner.updated",
  "occurred_at": "2026-09-20T16:00:00Z",
  "source": "pod5-alumni-network",
  "data": {
    "resource_id": "alumni-demo-001",
    "status": "updated"
  }
}
```

| Receipt field   | Observed value                       |
| --------------- | ------------------------------------ |
| Table           | a5_webhook_receipts                  |
| Row ID          | 1efa21a0-ca6b-42c3-b8af-d3978b5ca6c6 |
| received_at     | 2026-09-20T15:43:12.014038+00:00     |
| secret_verified | true                                 |

Acceptance log from a5_integration_logs:

```json
{
  "id": 1,
  "action": "webhook_received",
  "details": {
    "event_id": "alumni-local-test-001",
    "duplicate": false,
    "secret_verified": true
  },
  "created_at": "2026-09-20T15:43:13.406+00:00"
}
```

This was a local practice request. The source string alone does not prove Alumni sent it. The sample occurred_at was manually supplied and is later than received_at; use the database receipt time for this test. The original HTTP response capture has not been supplied.

Local automated route tests also verified that a wrong secret returns HTTP 401 without inserting an accepted receipt.

**Pending:** Real partner request and payload, HTTP response, receipt, partner confirmation, and a deployed wrong-secret rejection screenshot.

## 7. Webhook sender proof

Internal trigger for the planned test:

```http
POST https://team17-internship.vercel.app/api/integration/status-events
Authorization: Bearer [REDACTED OPERATOR TOKEN]
Content-Type: application/json
Idempotency-Key: a5-partner-demo-001
```

Planned request body, not yet a recorded production test:

```json
{
  "application_id": "app_demo_001",
  "previous_status": "under_review",
  "current_status": "approved"
}
```

The sender stores a demonstration event before delivery. It does not approve a real application. For Alumni, it maps the stored event to `id`, `type`, and `data`, serializes the payload once, and sends a lowercase hexadecimal HMAC-SHA256 signature of those exact bytes in `X-Webhook-Signature`. The event type is internship.status_changed and data includes demo=true.

At this report's database inspection, **a5_status_events contained zero rows**. No real outgoing webhook is therefore claimed.

**Pending:** Configure the partner receiver secret, run the trigger, capture the actual generated payload and timestamp, and obtain the partner response and confirmation. HTTP 201 from our creation endpoint does not prove delivery; check webhook_delivery.state and the partner's response. Failed or unknown delivery is not successful sender evidence.

## 8. Idempotency proof

The create endpoint requires Idempotency-Key. A PostgreSQL unique constraint reserves the key before sending. The same key and body return the original event; changed data with the same key returns HTTP 409. A replay does not send a second webhook.

### Verified local tests

The actual migration runs in PGlite, an embedded PostgreSQL runtime. Tests submitted ten claims with the same key and verified one creation and one event ID. Route tests verified the same result on replay and only one simulated outgoing call. Changed-payload conflicts and incoming event deduplication were also tested.

These are local checks, not production request evidence.

### Pending live evidence

Run the Section 7 request twice with identical body and key. Save both request/response transcripts. Expect the same event_id and idempotent_replay=true on the second call. An in-progress replay can return HTTP 202.

Run this read-only query after the test:

```sql
select idempotency_key, count(*) as resource_count
from public.a5_status_events
where idempotency_key = 'a5-partner-demo-001'
group by idempotency_key;
```

The expected resource_count is 1; that result has not yet been observed in production. Capture it and Alumni's logs confirming no additional webhook on replay.

## 9. Degradation and recovery proof

The consumer uses a 3,000 ms timeout through response-body reading. HTTP failures, invalid JSON and invalid response shapes produce controlled errors. Each new request can contact the partner again, allowing recovery without restarting Team 17.

### Verified local behavior

All six automated test groups passed on September 21:

- A local server stalled the response body; the request timed out.
- The same server restored service and a subsequent call succeeded without restarting.
- A route test simulated HTTP 503 and then HTTP 200.
- Invalid JSON and response-shape checks passed.

The automated timing test uses a shortened 40 ms deadline for speed; the application default is 3,000 ms. These tests do not prove an actual Alumni outage occurred.

### Pending coordinated test

Record the agreed broken test dependency, breakage timestamp, request, error/fallback JSON and log. Show that Team 17's independent status endpoint still returns HTTP 200. Have the partner restore its test service, then capture the next successful consumer response and recovery log on the same deployment.

Do not change the consumer URL and redeploy as a substitute for automatic recovery. The real breakage and restoration timestamps remain pending.

## 10. Agent-safe endpoint design

POST /api/integration/status-events requires operator authorization, validates input and creates a labeled demonstration event. It does not delete resources or change application approvals. Persistent keys prevent duplicate creation and repeated delivery attempts on replay. Errors contain code, message and retryable fields.

This implementation makes at most one delivery attempt per key. A timeout can leave delivery unknown, and a crash can leave a sending record unresolved. Creation replay does not retry delivery. Exactly-once delivery is not guaranteed; a future outbox worker should retry stable event IDs with receiver deduplication.

See [the implementation guide](IMPLEMENTATION_A5.md) for operation and limitations.

## 11. Reflection

These answers reflect verified implementation and local testing. Review them after the real partner session.

1. **Exposing versus consuming:** Exposing the service required resolving deployment identity, environment variables and public access. Consuming Alumni's endpoint required adapting its response shape and handling failures.
2. **What happened during failure:** Local timeout and HTTP-error simulations returned controlled errors. The real partner failure test is still pending.
3. **Safe failure:** Local tests verified explicit errors and rejection of invalid secrets without accepted receipt creation.
4. **Containment:** The status route does not depend on the partner. Its availability during the real outage still needs evidence.
5. **Human-readable errors:** Messages explain the failed operation without exposing raw database details.
6. **Machine-readable errors:** Codes, retryable flags and timestamps help clients interpret and correlate failures.
7. **Idempotency:** Reserving a database key before sending protects against repeated creation and delivery attempts caused by client replay.
8. **Before Gate 2:** Add configurable per-partner routing and authentication, reliable outbox delivery, real workflow triggers and broader deployed tests. Replace exposed credentials.
9. **Lesson:** Platform integration requires compatible contracts, authentication, duplicate protection, contained failures and independently captured partner evidence.

## 12. Evidence sources and submission checklist

Sources:

- Public production responses observed on September 21, retaining their original timestamps.
- Read-only inspection of the connected Supabase tables and logs.
- Local practice receipt from September 20.
- Automated test run on September 21: 6 groups passed, 0 failed.
- Team confirmation that real partner handshake and outage testing have not occurred.

A fresh public-response capture attempted during report preparation failed with a client-side TypeError. This is not counted as a controlled degradation test. The successful responses above are earlier verified observations.

Timestamps ending in Z or +00:00 are UTC. Thailand time is UTC+07:00. No screenshots or partner confirmations have been attached yet.

Before final submission:

- [ ] Attach consumer response screenshot.
- [ ] Add Alumni provider confirmation and matching request log.
- [ ] Add actual partner incoming webhook and wrong-secret test evidence.
- [ ] Add actual outgoing payload, partner response and confirmation.
- [ ] Add two production create-request transcripts and database count.
- [ ] Add coordinated failure and recovery evidence without restart.
- [ ] Review reflection against the completed partner session.
- [ ] Review the repeated student ID.
- [ ] Include all referenced screenshots/logs with the Markdown submission.
- [ ] Submit A5-Team17-Integration-Evidence.md.

This report is not yet a completed six-proof submission.
