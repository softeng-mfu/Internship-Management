export const PRIVACY_VERSION = "2026-11-10";
export const PRIVACY_CONTACT = "nadizeya@gmail.com";
export const PRIVACY_STORAGE_KEY = "internly.privacy.v1";
export const REMEMBER_DAYS = 180;
export type PrivacyChoice = {
  version: string;
  acknowledgedAt: string;
  expiresAt: string;
  rememberDevice: boolean;
};

export function createPrivacyChoice(
  rememberDevice: boolean,
  now = Date.now(),
): PrivacyChoice {
  return {
    version: PRIVACY_VERSION,
    acknowledgedAt: new Date(now).toISOString(),
    expiresAt: new Date(
      now + (rememberDevice ? REMEMBER_DAYS : 1) * 86400000,
    ).toISOString(),
    rememberDevice,
  };
}

export function readPrivacyChoice(
  raw: string | null,
  now = Date.now(),
): PrivacyChoice | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (
      !value ||
      value.version !== PRIVACY_VERSION ||
      typeof value.rememberDevice !== "boolean" ||
      typeof value.acknowledgedAt !== "string" ||
      typeof value.expiresAt !== "string"
    )
      return null;
    const created = Date.parse(value.acknowledgedAt),
      expiry = Date.parse(value.expiresAt);
    const maximum = (value.rememberDevice ? REMEMBER_DAYS : 1) * 86400000;
    if (
      !Number.isFinite(created) ||
      !Number.isFinite(expiry) ||
      created > now ||
      expiry <= now ||
      expiry <= created ||
      expiry - created > maximum
    )
      return null;
    return {
      version: value.version,
      acknowledgedAt: value.acknowledgedAt,
      expiresAt: value.expiresAt,
      rememberDevice: value.rememberDevice,
    };
  } catch {
    return null;
  }
}
