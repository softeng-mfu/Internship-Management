import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { getMigrations } from "better-auth/db/migration";
import { createAuthentication } from "../src/lib/auth";
import { workspaceStore } from "../src/lib/workspace";

test("advisor self-registration: hashed password, fixed role, empty scope, origin rejection and subsequent login", async () => {
  const db = new DatabaseSync(":memory:");
  const origin = "http://127.0.0.1:3001";
  const auth = createAuthentication(
    db,
    randomBytes(48).toString("hex"),
    origin,
  );
  await (await getMigrations(auth.options)).runMigrations();
  await workspaceStore(db).migrate();
  const password = randomBytes(24).toString("hex");
  const input = {
    name: "New Advisor",
    email: "new-advisor@example.test",
    password,
  };
  const call = (
    path: string,
    body?: unknown,
    cookie?: string,
    requestOrigin = origin,
  ) =>
    auth.handler(
      new Request(origin + "/api/auth/" + path, {
        method: body ? "POST" : "GET",
        headers: {
          origin: requestOrigin,
          "content-type": "application/json",
          ...(cookie ? { cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    );
  try {
    const signup = await call("sign-up/advisor", input);
    assert.equal(signup.status, 200);
    const created = await signup.json();
    assert.equal(created.user.role, "advisor");
    assert.equal(created.token, undefined);
    assert.equal(created.password, undefined);
    assert.match(signup.headers.get("set-cookie")!, /httponly/i);
    const cookie = signup.headers
      .getSetCookie()
      .map((v) => v.split(";")[0])
      .join("; ");
    const session = await (await call("get-session", undefined, cookie)).json();
    assert.equal(session.user.role, "advisor");
    assert.equal(session.user.emailVerified, false);
    const stored = db
      .prepare('select password from account where "userId"=?')
      .get(created.user.id);
    assert.ok(stored?.password);
    assert.notEqual(stored.password, password);
    const workspace = await workspaceStore(db).read(session.user);
    assert.deepEqual(workspace.students, []);
    assert.deepEqual(workspace.applications, []);
    assert.deepEqual(workspace.reports, []);
    assert.equal((await call("sign-up/advisor", input)).status, 409);
    assert.equal(
      (
        await call(
          "sign-up/advisor",
          { ...input, email: "other@example.test" },
          undefined,
          "https://untrusted.example",
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await call("sign-up/advisor", {
          ...input,
          email: "weak@example.test",
          password: "weak",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await call("sign-up/advisor", {
          ...input,
          email: "escalate@example.test",
          role: "admin",
        })
      ).status,
      400,
    );
    assert.equal(db.prepare('select count(*) as n from "user"').get()?.n, 1);
    await call("sign-out", {}, cookie);
    assert.equal(
      await (await call("get-session", undefined, cookie)).json(),
      null,
    );
    const signin = await call("sign-in/email", {
      email: input.email,
      password,
    });
    assert.equal(signin.status, 200);
    assert.equal((await signin.json()).user.role, "advisor");
  } finally {
    db.close();
  }
});
