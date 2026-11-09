import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
async function main() {
  const values = Object.fromEntries(
    readFileSync(".env.advisor.local", "utf8")
      .split(/\r?\n/)
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
  );
  const base = "http://127.0.0.1:3001";
  const call = (path: string, body?: unknown, cookie?: string) =>
    fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: {
        origin: base,
        ...(body ? { "content-type": "application/json" } : {}),
        ...(cookie ? { cookie } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      redirect: "manual",
      signal: AbortSignal.timeout(30000),
    });
  assert.equal((await call("/api/workspace")).status, 401);
  assert.equal((await call("/advisor")).status, 307);
  const login = await call("/api/auth/sign-in/email", {
    email: values.ADVISOR_EMAIL,
    password: values.ADVISOR_PASSWORD,
  });
  assert.equal(login.status, 200);
  const cookie = login.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ");
  try {
    assert.equal((await call("/advisor", undefined, cookie)).status, 200);
    const response = await call("/api/workspace", undefined, cookie);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.data.role, "advisor");
    assert.ok(Array.isArray(body.data.students));
    const foreign = await fetch(base + "/api/workspace", {
      method: "POST",
      headers: {
        cookie,
        origin: "https://untrusted.example",
        "content-type": "application/json",
      },
      body: JSON.stringify({ action: "reviewApplication" }),
    });
    assert.equal(foreign.status, 403);
    console.log(
      "PASS: advisor password login, protected page, real workspace data and cross-origin write rejection.",
    );
  } finally {
    assert.equal((await call("/api/auth/sign-out", {}, cookie)).status, 200);
  }
  assert.equal((await call("/api/workspace", undefined, cookie)).status, 401);
  console.log("PASS: advisor logout revokes workspace access.");
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Advisor smoke test failed");
  process.exitCode = 1;
});
