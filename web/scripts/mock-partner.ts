import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createInterface } from "node:readline";
let mode = "ok";
const secret = process.env.MOCK_WEBHOOK_SECRET;
const receipts = new Set<string>();
const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/api/integration/status") {
    if (mode === "slow") { setTimeout(() => { if (!res.destroyed) res.end('{"status":"late"}'); }, 10000); return; }
    if (mode === "error") { res.statusCode = 503; res.end('{"success":false}'); return; }
    if (mode === "invalid") { res.end("not json"); return; }
    res.end(JSON.stringify({ team: "mock-alumni", status: "ok", version: "0.1" })); return;
  }
  if (req.url === "/api/webhooks/partner" && req.method === "POST") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    try {
      const body = Buffer.concat(chunks).toString("utf8");
      const received = req.headers["x-webhook-signature"];
      const expected = secret ? createHmac("sha256", secret).update(body, "utf8").digest("hex") : "";
      const verified = typeof received === "string" && received.length === expected.length && timingSafeEqual(Buffer.from(received), Buffer.from(expected));
      if (!verified) { res.statusCode = 401; res.end('{"success":false}'); return; }
      const event = JSON.parse(body);
      const duplicate = receipts.has(event.id);
      receipts.add(event.id);
      console.log(JSON.stringify({ time: new Date().toISOString(), event, duplicate }));
      res.end(JSON.stringify({ success: true, event_id: event.id, duplicate }));
    } catch { res.statusCode = 400; res.end('{"success":false}'); }
    return;
  }
  res.statusCode = 404; res.end('{"success":false}');
});
server.listen(4100, "127.0.0.1", () => console.log("LOCAL MOCK ONLY on port 4100. Type ok, slow, error, or invalid then Enter. Changes do not restart either app."));
createInterface({ input: process.stdin }).on("line", line => {
  if (["ok", "slow", "error", "invalid"].includes(line.trim())) { mode = line.trim(); console.log(new Date().toISOString(), mode); }
});
