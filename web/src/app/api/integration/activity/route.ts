import { failure, json } from "@/lib/core";
import { requireOperator } from "@/lib/auth";
import { activityDatabase } from "@/lib/activity";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    requireOperator(request, "Enter your operator token to view integration activity.");
    const sql = activityDatabase();
    const [counts, events, receipts, logs] = await Promise.all([
      sql`select 'events' as kind, count(*)::int as count from public.a5_status_events union all select 'receipts', count(*)::int from public.a5_webhook_receipts union all select 'logs', count(*)::int from public.a5_integration_logs`,
      sql`select id, event->>'event_type' as type, delivery->>'state' as state, created_at from public.a5_status_events order by created_at desc limit 30`,
      sql`select id, source, event_type as type, secret_verified as verified, received_at as created_at from public.a5_webhook_receipts order by received_at desc limit 30`,
      sql`select id, action, created_at from public.a5_integration_logs order by created_at desc limit 30`,
    ]);
    // Deliberately omit raw payloads, secrets, request bodies and partner responses.
    return json({
      success: true,
      counts,
      events,
      receipts,
      logs,
      fetched_at: new Date().toISOString(),
    });
  } catch (e) {
    return failure(e);
  }
}
