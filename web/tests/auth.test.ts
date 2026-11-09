import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import { getMigrations } from "better-auth/db/migration";
import { createAuthentication } from "../src/lib/auth";
import { requireAdmin, requireAccount } from "../src/lib/admin-access";
import { ApiError } from "../src/lib/core";

test("real authentication: student signup, role escalation denial, administrator access, origin and session revocation", async () => {
  const db = new DatabaseSync(":memory:");
  const origin = "http://127.0.0.1:3001";
  const auth = createAuthentication(db, randomBytes(48).toString("hex"), origin);
  await (await getMigrations(auth.options)).runMigrations();
  const call = (path: string, body?: unknown, cookie?: string, requestOrigin = origin) => auth.handler(new Request(`${origin}/api/auth/${path}`, {
    method: body ? "POST" : "GET",
    headers: { origin: requestOrigin, ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }));
  const cookieOf = (response: Response) => response.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
  const password = randomBytes(24).toString("hex");
  try {
    const signup = await call("sign-up/email", { email: "student@example.test", password, name: "Test Student", role: "admin" });
    assert.equal(signup.status, 200);
    const created = await signup.json();
    assert.equal(created.user.role, "student");
    const stored = db.prepare('SELECT password FROM "account" WHERE "userId" = ?').get(created.user.id);
    assert.ok(stored?.password);
    assert.notEqual(stored.password, password);
    const cookie = cookieOf(signup);
    assert.ok(cookie);
    assert.match(signup.headers.get("set-cookie")!, /httponly/i);
    assert.match(signup.headers.get("set-cookie")!, /samesite=lax/i);
    assert.equal((await (await call("get-session", undefined, cookie)).json()).user.role, "student");
    await call("update-user", { name: "Updated Student", role: "admin" }, cookie);
    assert.equal((await (await call("get-session", undefined, cookie)).json()).user.role, "student");
    const request = (cookieValue?: string, method = "GET", requestOrigin = origin) => new Request(origin + "/api/integration/activity", {
      method, headers: { origin: requestOrigin, ...(cookieValue ? { cookie: cookieValue } : {}) },
    });
    const oldURL = process.env.BETTER_AUTH_URL;
    process.env.BETTER_AUTH_URL = origin;
    try {
      await assert.rejects(requireAdmin(request(), () => auth), (e: unknown) => e instanceof ApiError && e.status === 401);
      await assert.rejects(requireAdmin(request(cookie), () => auth), (e: unknown) => e instanceof ApiError && e.status === 403);
      await requireAccount(request(cookie), () => auth);
      await assert.rejects(requireAccount(request(), () => auth), (e: unknown) => e instanceof ApiError && e.status === 401);
      // Only trusted server-side provisioning can promote an account.
      db.prepare('UPDATE "user" SET role = ? WHERE id = ?').run("admin", created.user.id);
      await requireAdmin(request(cookie), () => auth);
      await assert.rejects(requireAdmin(request(cookie, "POST", "https://untrusted.example"), () => auth), (e: unknown) => e instanceof ApiError && e.code === "INVALID_ORIGIN");
      await requireAdmin(request(cookie, "POST"), () => auth);
      const expiryLogin = await call("sign-in/email", { email: "student@example.test", password });
      const expiryCookie = cookieOf(expiryLogin);
      const expirySession = await (await call("get-session", undefined, expiryCookie)).json();
      db.prepare('UPDATE "session" SET "expiresAt" = ? WHERE id = ?').run(Date.now() - 1000, expirySession.session.id);
      await assert.rejects(requireAdmin(request(expiryCookie), () => auth), (e: unknown) => e instanceof ApiError && e.status === 401);
      const badLogin = await call("sign-in/email", { email: "student@example.test", password: "incorrect-password" });
      assert.equal(badLogin.status, 401);
      const login = await call("sign-in/email", { email: "student@example.test", password });
      assert.equal(login.status, 200);
      const loginCookie = cookieOf(login);
      assert.equal((await call("sign-out", {}, loginCookie)).status, 200);
      assert.equal(await (await call("get-session", undefined, loginCookie)).json(), null);
      await assert.rejects(requireAdmin(request(loginCookie), () => auth), (e: unknown) => e instanceof ApiError && e.status === 401);
      const forbidden = await call("sign-up/email", { email: "other@example.test", password, name: "Other" }, undefined, "https://untrusted.example");
      assert.equal(forbidden.status, 403);
      const shortPassword = await call("sign-up/email", { email: "weak@example.test", password: "short", name: "Weak" });
      assert.equal(shortPassword.status, 400);
    } finally {
      if (oldURL === undefined) delete process.env.BETTER_AUTH_URL; else process.env.BETTER_AUTH_URL = oldURL;
    }
  } finally { db.close(); }
});
