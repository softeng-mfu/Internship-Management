import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { ApiError, createPartnerWebhook, eventSchema, normalizePartner, partnerRequest, readBody, secretMatches } from "../src/lib/core";
import { createHmac } from "node:crypto";
import { createServer } from "node:http";

test("secret verification and payload validation", () => {
  const secret = "s".repeat(32);
  assert.equal(secretMatches(secret, secret), true);
  assert.equal(secretMatches("wrong", secret), false);
  assert.equal(secretMatches(null, secret), false);
  assert.equal(eventSchema.safeParse({ application_id: "demo", previous_status: "approved", current_status: "approved" }).success, false);
});
test("Pod 5 webhook uses its required payload and HMAC-SHA256 signature", () => {
  const secret = "p".repeat(32);
  const webhook = createPartnerWebhook({
    event_id: "evt-001",
    event_type: "internship.status_changed",
    data: { demo: true },
  }, secret);
  assert.deepEqual(JSON.parse(webhook.body), {
    id: "evt-001",
    type: "internship.status_changed",
    data: { demo: true },
  });
  assert.equal(webhook.signature, createHmac("sha256", secret).update(webhook.body, "utf8").digest("hex"));
  assert.match(webhook.signature, /^[a-f0-9]{64}$/);
});
test("flat and wrapped partner contracts; rejects invalid JSON and shape", () => {
  const p = { team: "partner", status: "ok", version: "0.1" };
  assert.equal(normalizePartner(JSON.stringify(p)).partner_team, "partner");
  assert.equal(normalizePartner(JSON.stringify({ success: true, data: p })).partner_status, "ok");
  assert.throws(() => normalizePartner("bad"), /invalid JSON/);
  assert.throws(() => normalizePartner('{"success":false}'), /contract/);
});
test("body parsing rejects malformed and oversized payloads", async () => {
  const req = (body: string) => new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body });
  await assert.rejects(readBody(req("{")), (e: ApiError) => e.status === 400);
  await assert.rejects(readBody(req("x".repeat(17000))), (e: ApiError) => e.status === 413);
});
test("timeout includes a stalled body; service recovers without restart", async () => {
  let slow = true;
  const server = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.flushHeaders();
    if (!slow) res.end('{"team":"mock","status":"ok","version":"0.1"}');
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  const url = "http://127.0.0.1:" + address.port;
  try {
    await assert.rejects(partnerRequest(url, {}, 40), (e: ApiError) => e.code === "DEPENDENCY_TIMEOUT_OR_NETWORK_ERROR");
    slow = false;
    assert.equal(normalizePartner((await partnerRequest(url)).text).partner_status, "ok");
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
test("actual SQL migration: atomic claims, replay, conflict, receipt deduplication and privilege boundaries", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
    await db.exec(await readFile(new URL("../../supabase/migrations/202609200002_a5_integration.sql", import.meta.url), "utf8"));
    const payload = { application_id: "demo", previous_status: "under_review", current_status: "approved" };
    const claim = async (key: string, body = payload) => (await db.query<{ result: any }>("select public.a5_claim_event($1,$2::jsonb,$3) as result", [key, JSON.stringify(body), "team17"])).rows[0].result;
    const results = await Promise.all(Array.from({ length: 10 }, () => claim("same")));
    assert.equal(results.filter(x => x.created).length, 1);
    assert.equal(new Set(results.map(x => x.event.event_id)).size, 1);
    assert.equal((await claim("same", { ...payload, current_status: "rejected" })).conflict, true);
    await db.query("select public.a5_finish_event($1,$2::jsonb)", ["same", '{"state":"delivered","status":200}']);
    assert.equal((await claim("same")).delivery.state, "delivered");
    assert.equal((await claim("new")).created, true);
    const incoming = { event_id: "incoming1", event_type: "partner.updated", source: "partner", data: {} };
    const receive = async (event: unknown) => (await db.query<{ result: any }>("select public.a5_receive_webhook($1::jsonb) as result", [JSON.stringify(event)])).rows[0].result;
    assert.equal((await receive(incoming)).duplicate, false);
    assert.equal((await receive(incoming)).duplicate, true);
    assert.equal((await receive({ ...incoming, data: { changed: true } })).conflict, true);
    const privileges = await db.query<{ allowed: boolean }>("select has_function_privilege('anon','public.a5_claim_event(text,jsonb,text)','EXECUTE') as allowed");
    assert.equal(privileges.rows[0].allowed, false);
    const rls = await db.query<{ rowsecurity: boolean }>("select rowsecurity from pg_tables where tablename like 'a5_%'");
    assert.equal(rls.rows.length, 3);
    assert.ok(rls.rows.every(x => x.rowsecurity));
    await db.exec("set role authenticated");
    await assert.rejects(db.query("select * from public.a5_status_events"));
    await db.exec("reset role; set role service_role");
    assert.equal((await claim("service")).created, true);
  } finally { await db.close(); }
});
