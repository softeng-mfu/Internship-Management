import { test } from "node:test";
import assert from "node:assert/strict";
import { requireOperator } from "../src/lib/operator-auth";
import { ApiError } from "../src/lib/core";

test("operator access rejects invalid credentials and configuration while preserving route messages", () => {
  const originalToken = process.env.INTEGRATION_ADMIN_TOKEN;
  const token = "a".repeat(32);
  const request = (authorization?: string) => new Request("http://localhost/api/integration/activity", {
    headers: authorization === undefined ? {} : { Authorization: authorization },
  });
  try {
    process.env.INTEGRATION_ADMIN_TOKEN = token;
    assert.doesNotThrow(() => requireOperator(request("Bearer " + token)));
    for (const authorization of [undefined, "Bearer wrong", token]) {
      assert.throws(() => requireOperator(request(authorization)), (error: unknown) =>
        error instanceof ApiError && error.status === 401 && error.code === "UNAUTHORIZED" &&
        error.message === "An operator bearer token is required.",
      );
    }
    const activityMessage = "Enter your operator token to view integration activity.";
    assert.throws(() => requireOperator(request(), activityMessage), (error: unknown) =>
      error instanceof ApiError && error.status === 401 && error.message === activityMessage,
    );

    process.env.INTEGRATION_ADMIN_TOKEN = "short";
    assert.throws(() => requireOperator(request("Bearer short")), (error: unknown) =>
      error instanceof ApiError && error.status === 503 && error.code === "CONFIGURATION_INVALID",
    );
    delete process.env.INTEGRATION_ADMIN_TOKEN;
    assert.throws(() => requireOperator(request()), (error: unknown) =>
      error instanceof ApiError && error.status === 503 && error.code === "CONFIGURATION_MISSING",
    );
  } finally {
    if (originalToken === undefined) delete process.env.INTEGRATION_ADMIN_TOKEN;
    else process.env.INTEGRATION_ADMIN_TOKEN = originalToken;
  }
});
