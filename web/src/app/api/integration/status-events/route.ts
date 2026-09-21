import { ApiError, eventSchema, failure, json, partnerRequest, readBody, required, secretMatches } from "@/lib/core";
import { rpc, log } from "@/lib/store";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const token = required("INTEGRATION_ADMIN_TOKEN");
    if (token.length < 32) throw new ApiError(503, "CONFIGURATION_INVALID", "Operator token must have at least 32 characters.");
    if (!secretMatches(request.headers.get("Authorization"), "Bearer " + token))
      throw new ApiError(401, "UNAUTHORIZED", "An operator bearer token is required.");
    const key = request.headers.get("Idempotency-Key");
    if (!key || !/^[a-zA-Z0-9._:-]{1,128}$/.test(key))
      throw new ApiError(400, "MISSING_IDEMPOTENCY_KEY", "Provide an Idempotency-Key of 1-128 safe characters.");
    const parsed = eventSchema.safeParse(await readBody(request));
    if (!parsed.success) throw new ApiError(400, "INVALID_EVENT", "Provide application_id and two distinct supported statuses.");
    const url = required("PARTNER_WEBHOOK_URL");
    const secret = required("PARTNER_WEBHOOK_SECRET");
    if (secret.length < 32) throw new ApiError(503, "CONFIGURATION_INVALID", "Partner secret must have at least 32 characters.");
    const claim = await rpc("a5_claim_event", { p_key: key, p_data: parsed.data, p_source: process.env.TEAM_NAME ?? "team17-internship-management" });
    if (claim.conflict) throw new ApiError(409, "IDEMPOTENCY_KEY_CONFLICT", "Key already used with a different payload.");
    if (!claim.created) {
      return json({ success: true, data: claim.event, webhook_delivery: claim.delivery, idempotency_key: key, idempotent_replay: true }, claim.delivery.state === "sending" ? 202 : 200);
    }
    let delivery;
    try {
      const result = await partnerRequest(url, { method: "POST", headers: { "Content-Type": "application/json", "X-Webhook-Secret": secret }, body: JSON.stringify(claim.event) });
      // Store a bounded response; redact known credentials even if the receiver echoes them.
      const text = result.text.split(secret).join("[REDACTED]").slice(0, 4096);
      delivery = { state: result.ok ? "delivered" : "failed", status: result.status, response: text, attempted_at: new Date().toISOString() };
    } catch (e) {
      delivery = { state: "unknown", code: e instanceof ApiError ? e.code : "WEBHOOK_DELIVERY_FAILED", attempted_at: new Date().toISOString() };
    }
    await rpc("a5_finish_event", { p_key: key, p_delivery: delivery });
    await log("webhook_sent", { event_id: claim.event.event_id, partner_url: url, delivery });
    return json({ success: true, data: claim.event, webhook_delivery: delivery, idempotency_key: key, idempotent_replay: false }, 201);
  } catch (e) { return failure(e); }
}
