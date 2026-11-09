import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import { getMigrations } from "better-auth/db/migration";
import { createAuthentication } from "../src/lib/auth";
import { verifyStudent } from "../src/lib/student-login";
test("Identity authentication verifies the provider profile and issues a bounded student session without a local password", async () => {
  const id = "6731503070",
    origin = "http://127.0.0.1:3001";
  const token = `header.${Buffer.from(JSON.stringify({ sub: id, role: "student", exp: Math.floor(Date.now() / 1000) + 900 })).toString("base64url")}.signature`;
  const calls: { url: string; options?: RequestInit }[] = [];
  const fetcher: typeof fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return Response.json(
      String(url).endsWith("/auth/login")
        ? { token }
        : {
            student_id: id,
            first_name: "Test",
            last_name: "Student",
            email: "not-persisted@example.test",
          },
    );
  };
  const db = new DatabaseSync(":memory:");
  const auth = createAuthentication(
    db,
    randomBytes(48).toString("hex"),
    origin,
    { identityFetcher: fetcher },
  );
  await (await getMigrations(auth.options)).runMigrations();
  const call = (path: string, body?: unknown, cookie?: string) =>
    auth.handler(
      new Request(origin + "/api/auth/" + path, {
        method: body ? "POST" : "GET",
        headers: {
          origin,
          "content-type": "application/json",
          ...(cookie ? { cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    );
  try {
    const result = await call("sign-in/student-identity", {
      studentId: id,
      password: "provider-password",
    });
    assert.equal(result.status, 200);
    const value = await result.json();
    assert.equal(value.user.role, "student");
    assert.equal(value.user.studentId, id);
    assert.equal(value.token, undefined);
    assert.equal(
      calls[0].url,
      "https://student-identity.onrender.com/auth/login",
    );
    assert.equal(calls[1].url, "https://student-identity.onrender.com/me");
    assert.equal(
      (calls[1].options?.headers as Record<string, string>).Authorization,
      "Bearer " + token,
    );
    const cookie = result.headers
      .getSetCookie()
      .map((v) => v.split(";")[0])
      .join("; ");
    const session = await (await call("get-session", undefined, cookie)).json();
    assert.equal(session.user.authSource, "student-identity");
    assert.ok(
      new Date(session.session.expiresAt).getTime() <= Date.now() + 900001,
    );
    assert.equal(db.prepare("select count(*) as n from account").get()?.n, 0);
    assert.equal(
      (
        await call("sign-up/email", {
          name: "Self Advisor",
          email: "advisor@example.test",
          password: "some-long-password",
          role: "advisor",
        })
      ).status,
      400,
    );
    await call(
      "update-user",
      { studentId: "6731503999", authSource: "local", role: "advisor" },
      cookie,
    );
    const unchanged = await (
      await call("get-session", undefined, cookie)
    ).json();
    assert.equal(unchanged.user.role, "student");
    assert.equal(unchanged.user.studentId, id);
    const forbidden = await auth.handler(
      new Request(origin + "/api/auth/sign-in/student-identity", {
        method: "POST",
        headers: {
          origin: "https://evil.example",
          "content-type": "application/json",
        },
        body: JSON.stringify({ studentId: id, password: "do-not-forward" }),
      }),
    );
    assert.equal(forbidden.status, 403);
    await call("sign-out", {}, cookie);
    assert.equal(
      await (await call("get-session", undefined, cookie)).json(),
      null,
    );
    await assert.rejects(
      verifyStudent(id, "wrong", async () =>
        Response.json({ error: "denied" }, { status: 401 }),
      ),
    );
    await assert.rejects(
      verifyStudent(id, "password", async (url) =>
        Response.json(
          String(url).endsWith("/auth/login")
            ? { token }
            : {
                student_id: "6731503999",
                first_name: "Wrong",
                last_name: "Student",
              },
        ),
      ),
    );
  } finally {
    db.close();
  }
});
