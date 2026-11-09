import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

async function main() {
  const values = Object.fromEntries(readFileSync(".env.auth-admin.local", "utf8").split(/\r?\n/).filter(l => l && !l.startsWith("#")).map(l => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
  const base = "http://127.0.0.1:3001";
  const call = (path: string, body?: unknown, cookie?: string) => fetch(base + path, { method: body ? "POST" : "GET", headers: { origin: base, ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000) });
  assert.equal((await call("/sign-in")).status, 200);
  assert.equal((await call("/api/integration/activity")).status, 401);
  const login = await call("/api/auth/sign-in/email", { email: values.ADMIN_EMAIL, password: values.ADMIN_PASSWORD });
  assert.equal(login.status, 200, "Administrator sign-in failed");
  const cookie = login.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
  try {
    const session = await (await call("/api/auth/get-session", undefined, cookie)).json();
    assert.equal(session.user.role, "admin");
    const activity = await call("/api/integration/activity", undefined, cookie);
    assert.equal(activity.status, 200, "Activity database request failed");
    const data = await activity.json();
    assert.ok(Array.isArray(data.counts));
    console.log("PASS: sign-in page 200; guest activity 401; administrator login/session 200; real activity database 200.");
  } finally { assert.equal((await call("/api/auth/sign-out", {}, cookie)).status, 200); }
  assert.equal((await call("/api/integration/activity", undefined, cookie)).status, 401);
  console.log("PASS: sign-out revoked the session; previous cookie rejected with 401.");
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Authentication smoke test failed."); process.exitCode = 1; });
