import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createPrivacyChoice,
  readPrivacyChoice,
  PRIVACY_VERSION,
  REMEMBER_DAYS,
} from "../src/lib/privacy";
test("privacy choices are explicit, versioned, bounded and reject stale or malformed records", () => {
  const now = Date.parse("2026-11-10T08:00:00Z");
  const essential = createPrivacyChoice(false, now),
    remembered = createPrivacyChoice(true, now);
  assert.equal(essential.rememberDevice, false);
  assert.equal(Date.parse(essential.expiresAt) - now, 86400000);
  assert.equal(
    Date.parse(remembered.expiresAt) - now,
    REMEMBER_DAYS * 86400000,
  );
  assert.equal(
    readPrivacyChoice(JSON.stringify(essential), now)?.version,
    PRIVACY_VERSION,
  );
  assert.equal(
    readPrivacyChoice(JSON.stringify(remembered), now)?.rememberDevice,
    true,
  );
  assert.equal(
    readPrivacyChoice(JSON.stringify(essential), now + 86400000),
    null,
  );
  assert.equal(
    readPrivacyChoice(
      JSON.stringify(remembered),
      now + REMEMBER_DAYS * 86400000,
    ),
    null,
  );
  for (const raw of [
    null,
    "bad JSON",
    "null",
    "{}",
    "[]",
    JSON.stringify({ ...remembered, version: "old" }),
    JSON.stringify({ ...remembered, acknowledgedAt: "invalid" }),
    JSON.stringify({ ...remembered, expiresAt: "invalid" }),
    JSON.stringify({ ...remembered, rememberDevice: "true" }),
    JSON.stringify({
      ...remembered,
      acknowledgedAt: new Date(now + 1000).toISOString(),
    }),
    JSON.stringify({
      ...remembered,
      expiresAt: new Date(now + 181 * 86400000).toISOString(),
    }),
  ])
    assert.equal(readPrivacyChoice(raw, now), null);
});
