# A5 Team17 Integration Evidence
Status: NOT YET RUN against a deployed project and partner. This is an evidence template, not a completed submission.

## 1. Team information
Team: Team 17
Project: Internship Management Platform
Members: TODO
Deployed base URL: TODO

## 2. Partner information
Partner: pod5-alumni-network (confirm with partner)
Base URL: https://alumni-network-integration.phyo2lay.workers.dev
Public endpoint: GET /api/integration/status
Webhook receiver: POST /api/webhooks/partner
Secret method: X-Webhook-Secret over HTTPS; receiver-owned secrets per direction. Values omitted.

## 3. Provider proof
Our endpoint: GET /api/integration/status
Partner request timestamp: TODO
Request ID / internal hosting log: TODO
Response JSON / screenshot: TODO
Partner confirmation: TODO

## 4. Consumer proof
Our endpoint: GET /api/integration/partner-status
Partner URL: TODO
Request timestamp: TODO
Response status and body: TODO
Consumer log and screenshot: TODO

## 5. Webhook receiver proof
Incoming payload: TODO
Correct secret verification result and HTTP response: TODO
Wrong-secret 401 evidence: TODO
Supabase a5_webhook_receipts row: TODO
Partner confirmation: TODO

## 6. Webhook sender proof
Internal trigger: POST /api/integration/status-events (operator-authenticated demonstration event)
Trigger request and timestamp: TODO
Outgoing payload including data.demo=true: TODO
Partner response and delivery outcome: TODO
Partner confirmation: TODO

## 7. Idempotency proof
Key: TODO
Request 1 body and response: TODO
Request 2 identical body/key and response: TODO
Same event_id returned: TODO
SQL count proving one a5_status_events row: TODO
Partner logs proving no additional webhook on replay: TODO
Optional changed-payload conflict and concurrent-request checks: TODO

## 8. Degradation proof
Broken partner dependency and breakage timestamp: TODO
Timeout/error response JSON: TODO
Internal log: TODO
Unrelated status endpoint continues returning 200: TODO
Restoration timestamp: TODO
Next successful consumer call without restart or redeployment: TODO
Local mock tests must be labeled local practice, not real partner traffic.

## 9. Agent-safe endpoint design
POST /api/integration/status-events uses an operator bearer token and a persistent Idempotency-Key. It creates a demonstration event without changing application records. The same key/body returns the same event; a changed body returns 409. It never deletes data. Responses and errors are machine-readable. See IMPLEMENTATION_A5.md for delivery limitations.

## 10. Reflection
1. Was exposing or consuming the endpoint harder, and why? TODO
2. What happened when the dependency failed? TODO
3. Did the system fail safely? TODO
4. Was failure contained? TODO
5. Was the error useful to a human? TODO
6. Was the error useful to a machine or agent? TODO
7. How did idempotency improve safety? TODO
8. What would you improve before Gate 2? TODO
9. What did this lab teach you? TODO

## 11. Appendix
Attach real screenshots/logs with secrets and personal information redacted.
Deployment and partner handshake remain pending.

