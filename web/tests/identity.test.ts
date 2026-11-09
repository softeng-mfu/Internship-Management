import { test } from "node:test";
import assert from "node:assert/strict";
import { identityClaims } from "../src/lib/identity";
test("Identity operator boundary, configuration, consent and redacted claims", async () => {
  const before = { ...process.env };
  Object.assign(process.env, {
    INTEGRATION_ADMIN_TOKEN: "o".repeat(32),
    IDENTITY_SERVICE_CONFIRMED: "true",
    IDENTITY_API_KEY: "private-test-key",
    IDENTITY_CLIENT_ID: "internship",
  });
  const req = (
    body: unknown = { studentId: "6731503070" },
    token = "o".repeat(32),
  ) =>
    new Request("http://localhost/api/identity/claims", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  let calls = 0;
  const ok: typeof fetch = async (url, options) => {
    calls++;
    assert.equal(
      String(url),
      "https://student-identity.onrender.com/students/6731503070/claims",
    );
    assert.equal(
      new Headers(options?.headers).get("X-API-Key"),
      "private-test-key",
    );
    return Response.json({
      claims: {
        verified: true,
        profileComplete: true,
        skills: ["React"],
        email: "private@example.test",
      },
      issuedAt: "2026-11-09T10:00:00Z",
      secret: "hidden",
    });
  };
  try {
    assert.equal((await identityClaims(req({}, "wrong"), ok)).status, 401);
    assert.equal(calls, 0);
    process.env.IDENTITY_SERVICE_CONFIRMED = "false";
    assert.equal((await identityClaims(req(), ok)).status, 503);
    assert.equal(calls, 0);
    process.env.IDENTITY_SERVICE_CONFIRMED = "true";
    assert.equal(
      (await identityClaims(req({ studentId: "../admin" }), ok)).status,
      400,
    );
    const result = await identityClaims(req(), ok);
    const data = await result.json();
    assert.equal(data.authentication, false);
    assert.equal(data.data.claims.email, undefined);
    assert.ok(!JSON.stringify(data).includes("private-test-key"));
    assert.match(result.headers.get("Cache-Control")!, /no-store/);
    for (const [upstream, status, code] of [
      [401, 502, "IDENTITY_KEY_REJECTED"],
      [403, 403, "IDENTITY_CONSENT_REQUIRED"],
      [404, 404, "IDENTITY_STUDENT_NOT_FOUND"],
      [500, 503, "IDENTITY_UNAVAILABLE"],
    ] as const) {
      const r = await identityClaims(
        req(),
        async () =>
          new Response("private provider message", { status: upstream }),
      );
      assert.equal(r.status, status);
      assert.equal((await r.json()).error.code, code);
    }
    assert.equal(
      (await identityClaims(req(), async () => Response.json({ claims: {} })))
        .status,
      502,
    );
    assert.equal(
      (
        await identityClaims(req(), async () => {
          throw Error("private database details");
        })
      ).status,
      503,
    );
  } finally {
    for (const k of Object.keys(process.env))
      if (!(k in before)) delete process.env[k];
    Object.assign(process.env, before);
  }
});
