import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { POST as send } from "../src/app/api/integration/status-events/route";
import { POST as receive } from "../src/app/api/webhooks/partner/route";
import { GET as consume } from "../src/app/api/integration/partner-status/route";

test("routes with actual SQL: protected writes, one send per key, conflicts, secret rejection and consumer recovery", async () => {
  const db = new PGlite();
  const originalFetch = globalThis.fetch;
  const savedEnv = { ...process.env };
  let deliveries = 0;
  let broken = false;
  Object.assign(process.env, {
    SUPABASE_URL: "https://db.example.test", SUPABASE_SERVICE_ROLE_KEY: "test-server-key",
    INTEGRATION_ADMIN_TOKEN: "a".repeat(32), WEBHOOK_SECRET: "w".repeat(32),
    PARTNER_WEBHOOK_SECRET: "p".repeat(32), PARTNER_TEAM: "partner",
    PARTNER_API_URL: "https://partner.example.test/status", PARTNER_WEBHOOK_URL: "https://partner.example.test/hook",
  });
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
    await db.exec(await readFile(new URL("../../supabase/migrations/202609200002_a5_integration.sql", import.meta.url), "utf8"));
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url === process.env.PARTNER_WEBHOOK_URL) {
        deliveries++;
        const rawBody = String(init?.body);
        const signature = createHmac("sha256", "p".repeat(32)).update(rawBody, "utf8").digest("hex");
        assert.equal(new Headers(init?.headers).get("X-Webhook-Signature"), signature);
        assert.equal(new Headers(init?.headers).has("X-Webhook-Secret"), false);
        const outgoing = JSON.parse(rawBody);
        assert.deepEqual(Object.keys(outgoing).sort(), ["data", "id", "type"]);
        assert.equal(outgoing.type, "internship.status_changed");
        assert.equal(outgoing.data.demo, true);
        return Response.json({ success: true });
      }
      if (url === process.env.PARTNER_API_URL) return broken ? new Response("unavailable", { status: 503 }) : Response.json({ team: "partner", version: "1", status: "ok" });
      if (url.includes("/rpc/")) {
        const name = url.split("/rpc/")[1];
        const args = JSON.parse(String(init?.body));
        let result;
        if (name === "a5_claim_event") result = await db.query("select public.a5_claim_event($1,$2::jsonb,$3) as result", [args.p_key, JSON.stringify(args.p_data), args.p_source]);
        else if (name === "a5_finish_event") result = await db.query("select public.a5_finish_event($1,$2::jsonb) as result", [args.p_key, JSON.stringify(args.p_delivery)]);
        else result = await db.query("select public.a5_receive_webhook($1::jsonb) as result", [JSON.stringify(args.p_event)]);
        return Response.json((result.rows[0] as { result: unknown }).result);
      }
      if (url.includes("/a5_integration_logs")) return new Response(null, { status: 201 });
      throw new Error("Unexpected test URL: " + url);
    };
    const body = { application_id: "demo", previous_status: "under_review", current_status: "approved" };
    const request = (data: unknown = body, key = "route-test", token = "a".repeat(32)) => new Request("http://local/api/integration/status-events", {
      method: "POST", headers: { Authorization: "Bearer " + token, "Idempotency-Key": key, "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    assert.equal((await send(request(body, "route-test", "wrong"))).status, 401);
    const first = await send(request());
    assert.equal(first.status, 201);
    const original = await first.json();
    const replay = await (await send(request())).json();
    assert.equal(replay.data.event_id, original.data.event_id);
    assert.equal(replay.idempotent_replay, true);
    assert.equal(deliveries, 1);
    assert.equal((await send(request({ ...body, current_status: "rejected" }))).status, 409);
    assert.equal(deliveries, 1);
    const incoming = { event_id: "evt1", event_type: "partner.updated", occurred_at: "2026-09-20T16:00:00Z", source: "partner", data: {} };
    const hook = (secret: string) => new Request("http://local/api/webhooks/partner", { method: "POST", headers: { "Content-Type": "application/json", "X-Webhook-Secret": secret }, body: JSON.stringify(incoming) });
    assert.equal((await receive(hook("wrong"))).status, 401);
    assert.equal((await db.query<{ count: number }>("select count(*)::int as count from public.a5_webhook_receipts")).rows[0].count, 0);
    assert.equal((await (await receive(hook("w".repeat(32)))).json()).duplicate, false);
    assert.equal((await (await receive(hook("w".repeat(32)))).json()).duplicate, true);
    broken = true;
    const failureStart = Date.now();
    const failedConsumer = await consume();
    assert.equal(failedConsumer.status, 503);
    const failedBody = await failedConsumer.json();
    assert.ok(Date.parse(failedBody.requested_at) >= failureStart);
    assert.ok(Date.parse(failedBody.requested_at) <= Date.now());
    broken = false;
    const successStart = Date.now();
    const successfulConsumer = await consume();
    assert.equal(successfulConsumer.status, 200);
    const successBody = await successfulConsumer.json();
    assert.ok(Date.parse(successBody.requested_at) >= successStart);
    assert.ok(Date.parse(successBody.requested_at) <= Date.now());
    assert.ok(successBody.requested_at.endsWith("Z"));
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
    Object.assign(process.env, savedEnv);
    await db.close();
  }
});
