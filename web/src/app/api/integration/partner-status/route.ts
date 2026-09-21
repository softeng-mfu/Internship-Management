import { ApiError, failure, json, normalizePartner, partnerRequest, required } from "@/lib/core";
import { log } from "@/lib/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const started = Date.now();
  let url: string | undefined;
  try {
    url = required("PARTNER_API_URL");
    const response = await partnerRequest(url);
    if (!response.ok) throw new ApiError(503, "PARTNER_HTTP_ERROR", "Partner returned HTTP " + response.status, response.status >= 500 || response.status === 429);
    const data = normalizePartner(response.text);
    await log("consumer_request", { success: true, partner_url: url, status: response.status, duration_ms: Date.now() - started });
    return json({ success: true, data });
  } catch (e) {
    const result = failure(e);
    await log("consumer_request", { success: false, partner_url: url, code: e instanceof ApiError ? e.code : "INTERNAL_ERROR", duration_ms: Date.now() - started });
    const body = await result.json();
    return json({ ...body, error: { ...body.error, dependency: process.env.PARTNER_TEAM ?? "partner-api", timeout_ms: 3000 } }, result.status);
  }
}

