import { ApiError, failure, json, readBody, required, secretMatches, webhookSchema } from "@/lib/core";
import { log, rpc } from "@/lib/store";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    if (!secretMatches(request.headers.get("X-Webhook-Secret"), required("WEBHOOK_SECRET"))) {
      await log("webhook_rejected", { secret_verified: false, status: 401 });
      throw new ApiError(401, "INVALID_WEBHOOK_SECRET", "Webhook secret is invalid.");
    }
    const parsed = webhookSchema.safeParse(await readBody(request));
    if (!parsed.success) throw new ApiError(400, "INVALID_WEBHOOK_PAYLOAD", "event_id, event_type, occurred_at, source and data are required.");
    const event = parsed.data;
    if (event.source !== required("PARTNER_TEAM")) throw new ApiError(400, "INVALID_WEBHOOK_SOURCE", "Unexpected event source.");
    const result = await rpc("a5_receive_webhook", { p_event: event });
    if (result.conflict) throw new ApiError(409, "EVENT_ID_CONFLICT", "Event ID was already used with a different payload.");
    await log("webhook_received", { event_id: event.event_id, secret_verified: true, duplicate: result.duplicate });
    return json({ success: true, message: "Webhook accepted", event_id: event.event_id, duplicate: result.duplicate });
  } catch (e) { return failure(e); }
}

