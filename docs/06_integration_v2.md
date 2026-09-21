# Week 06 Workshop Lab  
## Extensibility & Integration  
### Step-by-Step Lab with Code Examples and AI Prompt Guide

**Course:** Platform Development for Software Engineering  
**Week:** 06  
**Topic:** Extensibility & Integration  
**Date:** Tue 8 Sep 2026  
**Lab Theme:** Inter-Team Handshake  
**Due Today:** A4 — AuthN/AuthZ evidence + one authorisation regression test  
**Due Next Week:** A5 — Integration evidence

---

# 1. Lab Overview

In this lab, your platform will connect with another team’s platform.

Your team will:

1. Provide one API endpoint for another team to call.
2. Call one endpoint from another team.
3. Receive one webhook from another team.
4. Send one webhook to another team.
5. Verify webhook requests using a shared secret.
6. Add idempotency key support to one create endpoint.
7. Handle timeout and broken dependencies safely.
8. Record evidence for Assignment A5.

The goal is not to build a large feature.

The goal is to prove that your platform can safely integrate with another system.

---

# 2. What You Will Build

| Component | What It Does |
|---|---|
| Public API Endpoint | Allows partner team to call your system |
| Partner API Consumer | Your system calls another team’s API |
| Webhook Receiver | Your system receives event notifications |
| Webhook Sender | Your system sends event notifications |
| Idempotent Endpoint | Prevents duplicate side effects |
| Degradation Handling | Prevents your system from crashing when a dependency fails |

---

# 3. Suggested Tech Stack

Students may use their own project stack.

Examples:

| Stack | Suitable For |
|---|---|
| Cloudflare Workers + Hono + D1 | Serverless API |
| Next.js API Routes + Supabase | Web app with backend routes |
| Express + SQLite/PostgreSQL | Node.js backend |
| FastAPI + SQLite/PostgreSQL | Python backend |
| Firebase Functions + Firestore | Firebase-based project |

The code examples below use TypeScript-style syntax.  
You may adapt them to your own stack.

---

# 4. Lab Setup

## Step 0 — Create Environment Variables

You should prepare these values in your project.

```env id="wk06-env"
TEAM_NAME=team-a
SERVICE_NAME=booking-platform
SERVICE_VERSION=0.1

PARTNER_API_URL=https://partner-team.example.com/api/integration/status
PARTNER_WEBHOOK_URL=https://partner-team.example.com/api/webhooks/partner

WEBHOOK_SECRET=team-a-secret-123
PARTNER_WEBHOOK_SECRET=team-b-secret-123
```

For local testing, you may store them in `.env`.

For deployed projects, configure them in:

- Cloudflare dashboard
- Vercel environment variables
- Render environment variables
- Railway environment variables
- Firebase config
- Supabase edge function secrets

---

## AI Prompt Example

```text id="prompt-env"
I am preparing environment variables for a software engineering lab about platform integration.

My project needs:
- team name
- service name
- version
- partner API URL
- partner webhook URL
- my webhook secret
- partner webhook secret

Please create a clean .env template and explain what each variable is used for.
```

---

# 5. Step 1 — Pair with a Partner Team

## Goal

Exchange integration information with another team.

Each team must provide:

```text id="partner-info-template"
Our Team:
Our Base URL:
Our Public Endpoint:
Our Webhook Receiver:
Our Shared Secret:

Partner Team:
Partner Base URL:
Partner Public Endpoint:
Partner Webhook Receiver:
Partner Shared Secret:
```

---

## Example

```text id="partner-info-example"
Our Team: Team A
Our Base URL: https://team-a.example.com
Our Public Endpoint: GET https://team-a.example.com/api/integration/status
Our Webhook Receiver: POST https://team-a.example.com/api/webhooks/partner
Our Shared Secret: team-a-secret-123

Partner Team: Team B
Partner Base URL: https://team-b.example.com
Partner Public Endpoint: GET https://team-b.example.com/api/integration/status
Partner Webhook Receiver: POST https://team-b.example.com/api/webhooks/partner
Partner Shared Secret: team-b-secret-123
```

---

## Evidence to Capture

- Partner team name
- Partner endpoint URL
- Your endpoint URL
- Screenshot or written confirmation

---

## AI Prompt Example

```text id="prompt-partner-info"
I am doing a platform integration lab.

Please create a clean partner integration information form for my team.

It should include:
- our team name
- our base URL
- our public endpoint
- our webhook receiver
- our shared secret
- partner team name
- partner base URL
- partner public endpoint
- partner webhook receiver
- partner shared secret
- testing notes

Format it for a software engineering lab report.
```

---

# 6. Step 2 — Create Your Public API Endpoint

## Goal

Create one endpoint that another team can call.

Example:

```http id="endpoint-status"
GET /api/integration/status
```

---

## Expected Response

```json id="status-response"
{
  "success": true,
  "data": {
    "team": "team-a",
    "service": "booking-platform",
    "status": "ok",
    "version": "0.1",
    "timestamp": "2026-09-08T10:00:00Z"
  }
}
```

---

## Example Code: Hono / Cloudflare Workers Style

```ts id="code-status-hono"
import { Hono } from "hono";

const app = new Hono();

app.get("/api/integration/status", (c) => {
  return c.json({
    success: true,
    data: {
      team: "team-a",
      service: "booking-platform",
      status: "ok",
      version: "0.1",
      timestamp: new Date().toISOString()
    }
  });
});

export default app;
```

---

## Example Code: Express Style

```ts id="code-status-express"
import express from "express";

const app = express();

app.get("/api/integration/status", (req, res) => {
  res.json({
    success: true,
    data: {
      team: "team-a",
      service: "booking-platform",
      status: "ok",
      version: "0.1",
      timestamp: new Date().toISOString()
    }
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

---

## Example Code: Next.js Route Handler

```ts id="code-status-next"
export async function GET() {
  return Response.json({
    success: true,
    data: {
      team: "team-a",
      service: "booking-platform",
      status: "ok",
      version: "0.1",
      timestamp: new Date().toISOString()
    }
  });
}
```

File path example:

```text id="next-file-path"
app/api/integration/status/route.ts
```

---

## Test with curl

```bash id="curl-status"
curl https://your-team.example.com/api/integration/status
```

---

## Evidence to Capture

- Endpoint URL
- Request command
- HTTP status code
- Response body
- Screenshot or terminal log

---

## AI Prompt Example

```text id="prompt-status-endpoint"
I am building a public integration status endpoint for a software engineering lab.

My stack is:
[insert your stack: Hono / Express / Next.js / FastAPI]

Please create this endpoint:

GET /api/integration/status

The endpoint should return JSON with:
- success
- team name
- service name
- status
- version
- timestamp

Please also include a curl command to test it.
Use simple student-friendly code.
```

---

# 7. Step 3 — Create a Partner API Consumer

## Goal

Create an endpoint in your system that calls your partner team’s endpoint.

Your endpoint:

```http id="endpoint-partner-status"
GET /api/integration/partner-status
```

Your endpoint will call:

```http id="partner-status-url"
GET https://partner-team.example.com/api/integration/status
```

---

## Expected Success Response

```json id="partner-success"
{
  "success": true,
  "data": {
    "partner_team": "team-b",
    "partner_status": "ok",
    "partner_version": "0.1"
  }
}
```

---

## Expected Failure Response

```json id="partner-failure"
{
  "success": false,
  "error": {
    "code": "PARTNER_SERVICE_UNAVAILABLE",
    "message": "Partner service is currently unavailable.",
    "dependency": "team-b-api",
    "retryable": true
  }
}
```

---

## Example Code: Fetch Partner API

```ts id="code-fetch-partner"
async function getPartnerStatus() {
  const partnerUrl = process.env.PARTNER_API_URL!;

  try {
    const response = await fetch(partnerUrl);

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: "PARTNER_HTTP_ERROR",
          message: "Partner API returned an error.",
          status: response.status,
          retryable: response.status >= 500
        }
      };
    }

    const partnerData = await response.json();

    return {
      success: true,
      data: {
        partner_team: partnerData.data?.team,
        partner_status: partnerData.data?.status,
        partner_version: partnerData.data?.version
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "PARTNER_SERVICE_UNAVAILABLE",
        message: "Partner service is currently unavailable.",
        dependency: "partner-api",
        retryable: true
      }
    };
  }
}
```

---

## Example Code: Hono Endpoint

```ts id="code-partner-status-hono"
app.get("/api/integration/partner-status", async (c) => {
  const result = await getPartnerStatus();

  if (!result.success) {
    return c.json(result, 503);
  }

  return c.json(result);
});
```

---

## Example Code: Express Endpoint

```ts id="code-partner-status-express"
app.get("/api/integration/partner-status", async (req, res) => {
  const result = await getPartnerStatus();

  if (!result.success) {
    return res.status(503).json(result);
  }

  return res.json(result);
});
```

---

## Test with curl

```bash id="curl-partner-status"
curl https://your-team.example.com/api/integration/partner-status
```

---

## Evidence to Capture

- Your endpoint URL
- Partner endpoint URL
- Successful response
- Error response if partner API fails
- Screenshot or terminal log

---

## AI Prompt Example

```text id="prompt-partner-consumer"
I need to create an API endpoint that calls another team's API.

My endpoint:
GET /api/integration/partner-status

Partner endpoint:
[insert partner endpoint URL]

My stack:
[insert stack]

Please write code that:
1. calls the partner endpoint
2. returns partner team, status, and version if successful
3. catches network errors
4. returns a machine-readable error if the partner API fails
5. uses a simple structure suitable for a student lab
```

---

# 8. Step 4 — Add Timeout Handling

## Goal

Your system must not wait forever when the partner API is slow or broken.

Use a timeout of 3 seconds.

---

## Example Code: Fetch with Timeout

```ts id="code-fetch-timeout"
async function fetchWithTimeout(url: string, timeoutMs = 3000) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
```

---

## Example Code: Partner Call with Timeout

```ts id="code-partner-timeout"
async function getPartnerStatusWithTimeout() {
  const partnerUrl = process.env.PARTNER_API_URL!;
  const timeoutMs = 3000;

  try {
    const response = await fetchWithTimeout(partnerUrl, timeoutMs);

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: "PARTNER_HTTP_ERROR",
          message: "Partner API returned an error.",
          status: response.status,
          retryable: response.status >= 500
        }
      };
    }

    const partnerData = await response.json();

    return {
      success: true,
      data: {
        partner_team: partnerData.data?.team,
        partner_status: partnerData.data?.status,
        partner_version: partnerData.data?.version
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "DEPENDENCY_TIMEOUT_OR_NETWORK_ERROR",
        message: "Partner API is unavailable or did not respond within 3000 ms.",
        dependency: "partner-api",
        timeout_ms: timeoutMs,
        retryable: true
      }
    };
  }
}
```

---

## Better Error Shape

```json id="timeout-error-shape"
{
  "success": false,
  "error": {
    "code": "DEPENDENCY_TIMEOUT_OR_NETWORK_ERROR",
    "message": "Partner API is unavailable or did not respond within 3000 ms.",
    "dependency": "partner-api",
    "timeout_ms": 3000,
    "retryable": true
  }
}
```

---

## Evidence to Capture

- Code showing timeout
- Normal success response
- Timeout or failure response
- Screenshot during dependency failure

---

## AI Prompt Example

```text id="prompt-timeout"
I have code that calls a partner API using fetch.

Please modify it to add a 3-second timeout using AbortController.

Requirements:
- If the partner API responds successfully, return the JSON response.
- If the partner API returns HTTP 4xx or 5xx, return a structured error.
- If the request times out or the network fails, return this error code:
  DEPENDENCY_TIMEOUT_OR_NETWORK_ERROR
- Include timeout_ms: 3000
- The error response must be machine-readable.

Here is my current code:
[paste your code]
```

---

# 9. Step 5 — Create a Webhook Receiver

## Goal

Create an endpoint that receives events from your partner team.

Example:

```http id="endpoint-webhook-receiver"
POST /api/webhooks/partner
```

---

## Expected Webhook Payload

```json id="webhook-payload"
{
  "event_id": "evt_001",
  "event_type": "partner.updated",
  "occurred_at": "2026-09-08T10:00:00Z",
  "source": "team-b",
  "data": {
    "resource_id": "res_001",
    "status": "updated"
  }
}
```

---

## Required Header

```http id="webhook-secret-header"
X-Webhook-Secret: your-shared-secret
```

---

## Example Code: Webhook Receiver

```ts id="code-webhook-receiver"
async function handlePartnerWebhook(request: Request) {
  const expectedSecret = process.env.WEBHOOK_SECRET;
  const receivedSecret = request.headers.get("X-Webhook-Secret");

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_WEBHOOK_SECRET",
          message: "Webhook secret is invalid."
        }
      },
      { status: 401 }
    );
  }

  const event = await request.json();

  if (!event.event_id || !event.event_type) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_WEBHOOK_PAYLOAD",
          message: "event_id and event_type are required."
        }
      },
      { status: 400 }
    );
  }

  console.log("Webhook received:", {
    event_id: event.event_id,
    event_type: event.event_type,
    source: event.source,
    occurred_at: event.occurred_at
  });

  return Response.json({
    success: true,
    message: "Webhook accepted",
    event_id: event.event_id
  });
}
```

---

## Example Code: Hono Endpoint

```ts id="code-webhook-hono"
app.post("/api/webhooks/partner", async (c) => {
  return handlePartnerWebhook(c.req.raw);
});
```

---

## Example Code: Express Endpoint

```ts id="code-webhook-express"
app.post("/api/webhooks/partner", express.json(), async (req, res) => {
  const expectedSecret = process.env.WEBHOOK_SECRET;
  const receivedSecret = req.header("X-Webhook-Secret");

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_WEBHOOK_SECRET",
        message: "Webhook secret is invalid."
      }
    });
  }

  const event = req.body;

  if (!event.event_id || !event.event_type) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_WEBHOOK_PAYLOAD",
        message: "event_id and event_type are required."
      }
    });
  }

  console.log("Webhook received:", event);

  return res.json({
    success: true,
    message: "Webhook accepted",
    event_id: event.event_id
  });
});
```

---

## Test with Correct Secret

```bash id="curl-webhook-correct"
curl -X POST https://your-team.example.com/api/webhooks/partner \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-shared-secret" \
  -d '{
    "event_id": "evt_test_001",
    "event_type": "test.event",
    "occurred_at": "2026-09-08T10:00:00Z",
    "source": "partner-team",
    "data": {
      "message": "Hello from partner"
    }
  }'
```

---

## Expected Response

```json id="webhook-correct-response"
{
  "success": true,
  "message": "Webhook accepted",
  "event_id": "evt_test_001"
}
```

---

## Test with Wrong Secret

```bash id="curl-webhook-wrong"
curl -X POST https://your-team.example.com/api/webhooks/partner \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: wrong-secret" \
  -d '{
    "event_id": "evt_test_002",
    "event_type": "test.event",
    "occurred_at": "2026-09-08T10:05:00Z",
    "source": "fake-partner",
    "data": {
      "message": "This should be rejected"
    }
  }'
```

---

## Expected Response

```json id="webhook-wrong-response"
{
  "success": false,
  "error": {
    "code": "INVALID_WEBHOOK_SECRET",
    "message": "Webhook secret is invalid."
  }
}
```

---

## Evidence to Capture

- Webhook receiver URL
- Correct-secret request and response
- Wrong-secret request and response
- HTTP status code
- Logs showing accepted event
- Note that wrong-secret event was rejected

---

## AI Prompt Example

```text id="prompt-webhook-receiver"
I need to build a webhook receiver for a platform integration lab.

My stack is:
[insert stack]

Endpoint:
POST /api/webhooks/partner

Requirements:
- Accept JSON body
- Read X-Webhook-Secret header
- Compare it with WEBHOOK_SECRET from environment variables
- Return 401 if the secret is invalid
- Validate that event_id and event_type exist
- Log event_id, event_type, source, and occurred_at
- Return a clear JSON response
- Use machine-readable error codes

Please write simple code suitable for students.
```

---

# 10. Step 6 — Send a Webhook to Partner Team

## Goal

Your platform sends an event to your partner team when something happens.

Example event:

```text id="event-example"
booking.created
```

---

## Example Webhook Payload

```json id="webhook-send-payload"
{
  "event_id": "evt_team_a_001",
  "event_type": "booking.created",
  "occurred_at": "2026-09-08T11:00:00Z",
  "source": "team-a",
  "data": {
    "booking_id": "bk_001",
    "user_id": "u_001",
    "status": "created"
  }
}
```

---

## Example Code: Send Webhook

```ts id="code-send-webhook"
async function sendWebhookToPartner(event: {
  event_id: string;
  event_type: string;
  occurred_at: string;
  source: string;
  data: Record<string, unknown>;
}) {
  const partnerWebhookUrl = process.env.PARTNER_WEBHOOK_URL!;
  const partnerSecret = process.env.PARTNER_WEBHOOK_SECRET!;

  try {
    const response = await fetchWithTimeout(partnerWebhookUrl, 3000, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": partnerSecret
      },
      body: JSON.stringify(event)
    });

    const responseText = await response.text();

    console.log("Partner webhook response:", {
      status: response.status,
      body: responseText
    });

    return {
      success: response.ok,
      status: response.status,
      body: responseText
    };
  } catch (error) {
    console.error("Failed to send webhook:", error);

    return {
      success: false,
      error: {
        code: "WEBHOOK_DELIVERY_FAILED",
        message: "Could not deliver webhook to partner team.",
        retryable: true
      }
    };
  }
}
```

---

## Updated Fetch with Timeout Supporting Options

```ts id="code-fetch-timeout-options"
async function fetchWithTimeout(
  url: string,
  timeoutMs = 3000,
  options: RequestInit = {}
) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
```

---

## Example Code: Trigger Webhook After Creating Booking

```ts id="code-create-booking-send-webhook"
async function createBooking(request: Request) {
  const body = await request.json();

  const booking = {
    booking_id: crypto.randomUUID(),
    user_id: body.user_id,
    room_id: body.room_id,
    status: "created",
    created_at: new Date().toISOString()
  };

  const event = {
    event_id: crypto.randomUUID(),
    event_type: "booking.created",
    occurred_at: new Date().toISOString(),
    source: "team-a",
    data: {
      booking_id: booking.booking_id,
      user_id: booking.user_id,
      status: booking.status
    }
  };

  const webhookResult = await sendWebhookToPartner(event);

  return Response.json({
    success: true,
    data: booking,
    webhook_delivery: webhookResult
  });
}
```

---

## Important Note

For this lab, it is acceptable to send the webhook inside the request flow.

However, in real production systems, webhook sending is usually done using a background job or queue so that a slow partner webhook does not slow down your user request.

---

## Evidence to Capture

- Trigger request
- Created resource
- Webhook payload
- Partner webhook URL
- Partner response
- Partner confirmation

---

## AI Prompt Example

```text id="prompt-send-webhook"
I need to send a webhook to my partner team when a booking is created.

My stack is:
[insert stack]

Partner webhook URL:
[insert partner webhook URL]

Partner shared secret:
[insert partner secret]

Please write code that:
1. creates a webhook payload with event_id, event_type, occurred_at, source, and data
2. sends it using POST
3. includes Content-Type: application/json
4. includes X-Webhook-Secret
5. uses a 3-second timeout
6. logs the partner response
7. catches errors so the main request does not crash

Use simple student-friendly code.
```

---

# 11. Step 7 — Add Idempotency Key to One Create Endpoint

## Goal

Prevent duplicate side effects when a request is retried.

Example endpoint:

```http id="endpoint-create-booking"
POST /api/bookings
```

Required header:

```http id="idempotency-header"
Idempotency-Key: booking-test-001
```

---

## Expected Behavior

| Request | Idempotency Key | Expected Result |
|---|---|---|
| First request | booking-test-001 | Create booking |
| Second request | booking-test-001 | Return original result |
| Third request | booking-test-002 | Create new booking |

---

## Example Code: In-Memory Idempotency

```ts id="code-idempotency-memory"
const processedKeys = new Map<string, any>();

async function createBookingWithIdempotency(request: Request) {
  const idempotencyKey = request.headers.get("Idempotency-Key");

  if (!idempotencyKey) {
    return Response.json(
      {
        success: false,
        error: {
          code: "MISSING_IDEMPOTENCY_KEY",
          message: "Idempotency-Key header is required.",
          retryable: false
        }
      },
      { status: 400 }
    );
  }

  if (processedKeys.has(idempotencyKey)) {
    const originalResult = processedKeys.get(idempotencyKey);

    return Response.json({
      success: true,
      data: originalResult,
      idempotency_key: idempotencyKey,
      idempotent_replay: true
    });
  }

  const body = await request.json();

  const booking = {
    booking_id: crypto.randomUUID(),
    user_id: body.user_id,
    room_id: body.room_id,
    status: "created",
    created_at: new Date().toISOString()
  };

  processedKeys.set(idempotencyKey, booking);

  return Response.json({
    success: true,
    data: booking,
    idempotency_key: idempotencyKey,
    idempotent_replay: false
  });
}
```

---

## Example Code: Hono Endpoint

```ts id="code-idempotency-hono"
app.post("/api/bookings", async (c) => {
  return createBookingWithIdempotency(c.req.raw);
});
```

---

## Example Code: Express Endpoint

```ts id="code-idempotency-express"
const processedKeys = new Map<string, any>();

app.post("/api/bookings", express.json(), async (req, res) => {
  const idempotencyKey = req.header("Idempotency-Key");

  if (!idempotencyKey) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_IDEMPOTENCY_KEY",
        message: "Idempotency-Key header is required.",
        retryable: false
      }
    });
  }

  if (processedKeys.has(idempotencyKey)) {
    return res.json({
      success: true,
      data: processedKeys.get(idempotencyKey),
      idempotency_key: idempotencyKey,
      idempotent_replay: true
    });
  }

  const booking = {
    booking_id: crypto.randomUUID(),
    user_id: req.body.user_id,
    room_id: req.body.room_id,
    status: "created",
    created_at: new Date().toISOString()
  };

  processedKeys.set(idempotencyKey, booking);

  return res.json({
    success: true,
    data: booking,
    idempotency_key: idempotencyKey,
    idempotent_replay: false
  });
});
```

---

## Optional Database Table

For real deployment, store idempotency keys in a database.

```sql id="sql-idempotency-table"
CREATE TABLE idempotency_keys (
  key TEXT PRIMARY KEY,
  response_body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

---

## Evidence to Capture

- First request with idempotency key
- Second request with the same idempotency key
- First response
- Second response
- Proof that only one resource was created

---

## AI Prompt Example

```text id="prompt-idempotency"
I need to add idempotency key support to this create endpoint:

[paste your endpoint code]

My stack is:
[insert stack]

Requirements:
- Read Idempotency-Key from request header
- If missing, return 400 with error code MISSING_IDEMPOTENCY_KEY
- If the key was already used, return the original response
- If the key is new, create the resource and store the result
- Return idempotent_replay: false for the first request
- Return idempotent_replay: true for repeated request
- Use an in-memory Map for lab demonstration
- Mention how to store it in a database for production

Please modify my code.
```

---

# 12. Step 8 — Test Idempotency

## First Request

```bash id="curl-idempotency-first"
curl -X POST https://your-team.example.com/api/bookings \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: booking-test-001" \
  -d '{
    "user_id": "u_001",
    "room_id": "room_101"
  }'
```

---

## Second Request with Same Key

```bash id="curl-idempotency-second"
curl -X POST https://your-team.example.com/api/bookings \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: booking-test-001" \
  -d '{
    "user_id": "u_001",
    "room_id": "room_101"
  }'
```

---

## Third Request with New Key

```bash id="curl-idempotency-third"
curl -X POST https://your-team.example.com/api/bookings \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: booking-test-002" \
  -d '{
    "user_id": "u_001",
    "room_id": "room_101"
  }'
```

---

## Expected Result

The first request should return:

```json id="idempotency-first-response"
{
  "idempotent_replay": false
}
```

The second request should return:

```json id="idempotency-second-response"
{
  "idempotent_replay": true
}
```

The third request should return:

```json id="idempotency-third-response"
{
  "idempotent_replay": false
}
```

---

## AI Prompt Example

```text id="prompt-idempotency-test"
Please create a test plan for my idempotency endpoint.

Endpoint:
POST [insert endpoint URL]

Request body:
[paste request body]

Header:
Idempotency-Key

The test should include:
1. first request with key booking-test-001
2. second request with the same key booking-test-001
3. third request with a new key booking-test-002
4. expected response for each request
5. what evidence I should capture
6. how to explain the result in my lab report
```

---

# 13. Step 9 — Add Webhook Sending to Idempotent Create Endpoint

## Goal

Combine idempotency and webhook sending.

When booking is created for the first time, send a webhook.

When the same request is replayed with the same idempotency key, do not send another webhook.

---

## Example Code

```ts id="code-idempotency-with-webhook"
const processedKeys = new Map<string, any>();

async function createBookingIdempotentWithWebhook(request: Request) {
  const idempotencyKey = request.headers.get("Idempotency-Key");

  if (!idempotencyKey) {
    return Response.json(
      {
        success: false,
        error: {
          code: "MISSING_IDEMPOTENCY_KEY",
          message: "Idempotency-Key header is required.",
          retryable: false
        }
      },
      { status: 400 }
    );
  }

  if (processedKeys.has(idempotencyKey)) {
    const originalResult = processedKeys.get(idempotencyKey);

    return Response.json({
      success: true,
      data: originalResult.booking,
      webhook_delivery: originalResult.webhook_delivery,
      idempotency_key: idempotencyKey,
      idempotent_replay: true
    });
  }

  const body = await request.json();

  const booking = {
    booking_id: crypto.randomUUID(),
    user_id: body.user_id,
    room_id: body.room_id,
    status: "created",
    created_at: new Date().toISOString()
  };

  const event = {
    event_id: crypto.randomUUID(),
    event_type: "booking.created",
    occurred_at: new Date().toISOString(),
    source: "team-a",
    data: {
      booking_id: booking.booking_id,
      user_id: booking.user_id,
      status: booking.status
    }
  };

  const webhookDelivery = await sendWebhookToPartner(event);

  const result = {
    booking,
    webhook_delivery: webhookDelivery
  };

  processedKeys.set(idempotencyKey, result);

  return Response.json({
    success: true,
    data: booking,
    webhook_delivery: webhookDelivery,
    idempotency_key: idempotencyKey,
    idempotent_replay: false
  });
}
```

---

## Why This Matters

Without this protection, a retry can create this bug:

```text id="duplicate-webhook-bug"
First request:
- creates booking
- sends booking.created webhook

Retry request:
- creates another booking
- sends another booking.created webhook
```

With idempotency:

```text id="idempotent-webhook-safe"
First request:
- creates booking
- sends booking.created webhook

Retry request:
- returns original result
- does not create another booking
- does not send another webhook
```

---

## AI Prompt Example

```text id="prompt-idempotency-webhook"
I have a create booking endpoint that sends a webhook after creating a booking.

Please modify it so that:
- It requires Idempotency-Key
- The first request creates the booking and sends the webhook
- A repeated request with the same key returns the original result
- A repeated request must not send the webhook again
- The response should include idempotent_replay true or false
- Use an in-memory Map for lab demonstration

Here is my current code:
[paste your code]
```

---

# 14. Step 10 — Perform Deliberate Breakage Test

## Goal

Observe what happens when a dependency fails.

Your system should not hang forever or crash.

---

## Breakage Options

| Breakage Type | Example |
|---|---|
| Stop API | Partner turns off endpoint |
| Slow API | Partner adds 10-second delay |
| HTTP 500 | Partner returns server error |
| Invalid JSON | Partner returns plain text |
| Wrong Secret | Partner sends webhook with wrong secret |
| Duplicate Request | Same idempotency key sent twice |

---

## Example Code: Simulate Slow Endpoint

Partner team may temporarily add:

```ts id="code-slow-endpoint"
app.get("/api/integration/status", async (c) => {
  await new Promise((resolve) => setTimeout(resolve, 10000));

  return c.json({
    success: true,
    data: {
      team: "team-b",
      status: "ok"
    }
  });
});
```

Expected result:

Your system should timeout after 3 seconds.

---

## Example Code: Simulate HTTP 500

```ts id="code-http-500"
app.get("/api/integration/status", (c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "SIMULATED_SERVER_ERROR",
        message: "This is a deliberate test failure."
      }
    },
    500
  );
});
```

---

## Example Code: Simulate Invalid JSON

```ts id="code-invalid-json"
app.get("/api/integration/status", (c) => {
  return c.text("this is not json");
});
```

---

## Degradation Note Template

```text id="degradation-template"
Breakage time:
Broken dependency:
Test performed:
Expected behavior:
Actual behavior:
Error code:
Timeout duration:
Did unrelated features still work?
Did the system recover automatically?
Was manual restart required?
Evidence:
```

---

## Example Degradation Note

```text id="degradation-example"
At 11:25, Team B API became unavailable.

Our endpoint:
GET /api/integration/partner-status

returned:

{
  "success": false,
  "error": {
    "code": "DEPENDENCY_TIMEOUT_OR_NETWORK_ERROR",
    "message": "Partner API is unavailable or did not respond within 3000 ms.",
    "dependency": "partner-api",
    "timeout_ms": 3000,
    "retryable": true
  }
}

The booking feature still worked.
Only the partner status feature was affected.

At 11:32, Team B API came back.
Our system recovered automatically without manual restart.
```

---

## Evidence to Capture

- Screenshot during failure
- Error response
- Timestamp
- Log
- Screenshot after recovery
- Short explanation

---

## AI Prompt Example

```text id="prompt-degradation"
I performed a dependency breakage test for my platform integration lab.

Here is what happened:
[paste logs, response body, timestamps, and what was broken]

Please help me write a clear degradation note that explains:
- what dependency failed
- what my system returned
- whether the failure was contained
- whether unrelated features still worked
- whether the system recovered automatically
- what should be improved

Do not invent evidence. If something is missing, mark it as missing.
```

---

# 15. Step 11 — Design One Agent-Safe Endpoint

## Goal

Design one endpoint that an AI agent could call safely in the future.

The endpoint should be:

1. Idempotent
2. Machine-readable
3. Non-destructive by default
4. Explicit about errors
5. Safe to retry

---

## Example Agent-Safe Endpoint

```http id="agent-safe-endpoint"
POST /api/tasks/create
```

---

## Example Request

```json id="agent-safe-request"
{
  "title": "Prepare weekly report",
  "priority": "normal"
}
```

---

## Example Response

```json id="agent-safe-response"
{
  "success": true,
  "data": {
    "task_id": "task_001",
    "title": "Prepare weekly report",
    "priority": "normal",
    "status": "created"
  },
  "idempotency_key": "task-create-001",
  "idempotent_replay": false
}
```

---

## Example Error

```json id="agent-safe-error"
{
  "success": false,
  "error": {
    "code": "MISSING_REQUIRED_FIELD",
    "message": "title is required.",
    "field": "title",
    "retryable": false
  }
}
```

---

## Design Note Template

```text id="agent-safe-template"
Endpoint:
Method:
Purpose:
Why this endpoint is safe for AI agent use:
Idempotency behavior:
Error response format:
Destructive action protection:
Example request:
Example response:
```

---

## AI Prompt Example

```text id="prompt-agent-safe"
I need to design one agent-safe endpoint for my software engineering platform.

My platform is about:
[briefly describe your project]

Please help me design one endpoint that an AI agent could safely call.

Requirements:
- idempotent
- machine-readable errors
- no destructive default behavior
- safe to retry
- destructive actions require explicit confirmation
- include method, URL, purpose, request body, response body, and error response

Make the design suitable for a student lab report.
```

---

# 16. Step 12 — Prepare A5 Integration Evidence Report

## Required Report Structure

```markdown id="a5-template"
# A5 — Integration Evidence

## 1. Team Information

Team Name:
Members:
Project Name:
Base URL:

## 2. Partner Team Information

Partner Team:
Partner Base URL:
Partner Public Endpoint:
Partner Webhook Receiver:
Shared Secret Method:

## 3. API Provided by Our Team

Endpoint:
Method:
Purpose:
Success Response:
Error Response:
Evidence:

## 4. Partner API Consumed by Our Team

Partner Endpoint:
Our Consumer Endpoint:
Success Test:
Failure Test:
Timeout Handling:
Evidence:

## 5. Webhook Receiver Evidence

Webhook Receiver URL:
Expected Header:
Sample Payload:
Correct Secret Test:
Wrong Secret Test:
Log Evidence:

## 6. Webhook Sender Evidence

Trigger Action:
Partner Webhook URL:
Payload Sent:
Partner Response:
Evidence:

## 7. Idempotency Evidence

Endpoint:
Idempotency Key:
First Request:
Second Request:
Result:
Duplicate Prevented? Yes/No
Evidence:

## 8. Degradation Test

Broken Dependency:
Breakage Time:
Expected Behavior:
Actual Behavior:
Error Response:
Did unrelated features still work?
Did the system recover automatically?
Evidence:

## 9. Agent-Safe Endpoint Design

Endpoint:
Purpose:
Why it is safe:
Idempotency behavior:
Error response:
Destructive action protection:

## 10. Reflection

Answer the reflection questions here.

## 11. Appendix

Screenshots:
Logs:
curl commands:
Additional notes:
```

---

## AI Prompt Example

```text id="prompt-a5-report"
I need to write my A5 Integration Evidence report.

Here is my lab evidence:
[paste team info, partner info, URLs, request bodies, response bodies, logs, screenshots description, and timestamps]

Please organize it into this structure:
1. Team Information
2. Partner Team Information
3. API Provided by Our Team
4. Partner API Consumed by Our Team
5. Webhook Receiver Evidence
6. Webhook Sender Evidence
7. Idempotency Evidence
8. Degradation Test
9. Agent-Safe Endpoint Design
10. Reflection
11. Appendix

Important:
- Do not invent evidence.
- If something is missing, mark it as missing.
- Use clear English suitable for a software engineering course submission.
- Include request and response examples where available.
```

---

# 17. Full Lab Checklist

## API Integration

- [ ] Created one public endpoint
- [ ] Partner team successfully called your endpoint
- [ ] Your team successfully called partner endpoint
- [ ] Your system handles partner API failure
- [ ] Timeout is implemented

## Webhook

- [ ] Created webhook receiver
- [ ] Tested webhook receiver with correct secret
- [ ] Tested webhook receiver with wrong secret
- [ ] Sent webhook to partner team
- [ ] Partner team confirmed webhook received

## Idempotency

- [ ] Added idempotency key to one create/update endpoint
- [ ] Tested first request
- [ ] Tested repeated request with same key
- [ ] Confirmed no duplicate side effect
- [ ] Confirmed repeated request does not resend webhook

## Degradation

- [ ] Tested broken dependency
- [ ] Captured timeout/error behavior
- [ ] Checked whether unrelated features still worked
- [ ] Checked whether system recovered automatically
- [ ] Wrote degradation note

## Agent-Safe Design

- [ ] Designed one endpoint safe for AI agent use
- [ ] Included idempotency behavior
- [ ] Included machine-readable errors
- [ ] Avoided destructive default behavior

---

# 18. Reflection Questions

Answer briefly in your report.

1. What was harder: exposing your API or consuming another team’s API? Why?
2. What happened when your dependency failed?
3. Did your system fail safely?
4. Did the failure stay contained or cascade to other features?
5. Was your error response useful for a human?
6. Was your error response useful for a machine or AI agent?
7. How did idempotency change the safety of your endpoint?
8. What would you improve before Gate 2?
9. What did this lab teach you about real platform development?

---

# 19. Grading Rubric

| Criteria | Excellent | Acceptable | Needs Improvement |
|---|---|---|---|
| Public endpoint | Clear, deployed, documented, partner can call it | Works but documentation is weak | Endpoint unclear or not accessible |
| Partner API consumption | Real call with timeout and evidence | Real call but weak error handling | No working partner call |
| Timeout handling | Clean timeout with structured error | Timeout exists but unclear response | Hangs or crashes |
| Webhook receiver | Verifies secret and logs event | Receives event but weak verification | Trusts payload blindly |
| Webhook sender | Sends real webhook and captures partner response | Sends webhook but evidence incomplete | No working webhook sender |
| Idempotency | Same key returns original result without duplicate side effect | Partial idempotency | Duplicate side effects possible |
| Degradation note | Clear observation with timestamp and evidence | Basic observation | No real breakage evidence |
| Agent-safe endpoint | Safe, idempotent, machine-readable, non-destructive | Partially safe | Unsafe or vague |
| Evidence quality | Complete transcript, logs, screenshots | Partial evidence | Claims without proof |
| Reflection | Clear technical insight | Basic reflection | Superficial or missing |

---

# 20. Minimum Passing Requirement

To pass this lab, your team must show:

1. One working endpoint that another team can call.
2. One successful call to another team’s endpoint.
3. One webhook received from another team.
4. One webhook sent to another team.
5. One invalid-secret rejection test.
6. One idempotency key test.
7. One degradation note from a broken dependency.

Without evidence, the feature is not considered complete.

---

# 21. Closing Note

A platform is not proven by a diagram.

A platform is proven when another team can successfully depend on your system, your system can safely depend on theirs, and your platform does not collapse when the other side breaks.

This lab is the first real integration test of your platform before Gate 2.