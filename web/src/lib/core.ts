import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public retryable = false) { super(message); }
}
export function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new ApiError(503, "CONFIGURATION_MISSING", "Service configuration is incomplete.");
  return value;
}
export function secretMatches(received: string | null, expected: string) {
  if (expected.length < 32) throw new ApiError(503, "CONFIGURATION_INVALID", "Secret configuration is incomplete.");
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return received !== null && timingSafeEqual(digest(received), digest(expected));
}
export function createPartnerWebhook(event: { event_id: string; event_type: string; data: Record<string, unknown> }, secret: string) {
  const payload = { id: event.event_id, type: event.event_type, data: event.data };
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(body, "utf8").digest("hex");
  return { body, signature, payload };
}
export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}
export function failure(error: unknown) {
  const e = error instanceof ApiError ? error : new ApiError(503, "STORAGE_UNAVAILABLE", "The operation could not be completed.", true);
  return json({ success: false, error: { code: e.code, message: e.message, retryable: e.retryable } }, e.status);
}
export async function readBody(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ApiError(415, "CONTENT_TYPE_REQUIRED", "Use application/json.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "INVALID_JSON", "A JSON body is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 16384) { await reader.cancel(); throw new ApiError(413, "BODY_TOO_LARGE", "Body exceeds 16 KB."); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new ApiError(400, "INVALID_JSON", "Body must contain valid JSON."); }
}
export const webhookSchema = z.object({
  event_id: z.string().min(1).max(128),
  event_type: z.string().min(1).max(100),
  occurred_at: z.iso.datetime({ offset: true }),
  source: z.string().min(1).max(100),
  data: z.record(z.string(), z.unknown()),
}).strict();
const status = z.enum(["submitted", "under_review", "approved", "rejected", "withdrawn"]);
export const eventSchema = z.object({
  application_id: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/),
  previous_status: status,
  current_status: status,
}).strict().refine(x => x.previous_status !== x.current_status);
export async function partnerRequest(url: string, options: RequestInit = {}, timeoutMs = 3000, fetcher: typeof fetch = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, { ...options, signal: controller.signal, cache: "no-store", redirect: "error" });
    // Keep the deadline active through body consumption, not only until headers arrive.
    const text = await response.text();
    if (text.length > 65536) throw new ApiError(502, "PARTNER_RESPONSE_TOO_LARGE", "Partner response exceeds the size limit.");
    return { status: response.status, ok: response.ok, text };
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(503, "DEPENDENCY_TIMEOUT_OR_NETWORK_ERROR", "Partner unavailable or response exceeded 3000 ms.", true);
  } finally { clearTimeout(timer); }
}
export function normalizePartner(text: string) {
  let raw;
  try { raw = JSON.parse(text); } catch { throw new ApiError(502, "PARTNER_INVALID_JSON", "Partner returned invalid JSON."); }
  const shape = z.object({ team: z.string().min(1), service: z.string().optional(), status: z.string().min(1), version: z.string().min(1) });
  const result = shape.safeParse(raw?.data ?? raw);
  if (raw?.success === false || !result.success) throw new ApiError(502, "PARTNER_INVALID_RESPONSE", "Partner response does not match the contract.");
  return { partner_team: result.data.team, partner_service: result.data.service, partner_status: result.data.status, partner_version: result.data.version };
}
