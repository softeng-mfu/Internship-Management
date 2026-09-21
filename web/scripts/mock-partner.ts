import { createServer } from "node:http";
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
    if (!secret || req.headers["x-webhook-secret"] !== secret) { res.statusCode = 401; res.end('{"success":false}'); return; }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    try {
      const event = JSON.parse(Buffer.concat(chunks).toString());
      const duplicate = receipts.has(event.event_id);
      receipts.add(event.event_id);
      console.log(JSON.stringify({ time: new Date().toISOString(), event, duplicate }));
      res.end(JSON.stringify({ success: true, event_id: event.event_id, duplicate }));
    } catch { res.statusCode = 400; res.end('{"success":false}'); }
    return;
  }
  res.statusCode = 404; res.end('{"success":false}');
});
server.listen(4100, "127.0.0.1", () => console.log("LOCAL MOCK ONLY on port 4100. Type ok, slow, error, or invalid then Enter. Changes do not restart either app."));
createInterface({ input: process.stdin }).on("line", line => {
  if (["ok", "slow", "error", "invalid"].includes(line.trim())) { mode = line.trim(); console.log(new Date().toISOString(), mode); }
});

