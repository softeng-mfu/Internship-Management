import { betterAuth } from "better-auth";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

export function createAuthentication(database: DatabaseSync | Pool, secret: string, baseURL: string) {
  if (secret.length < 32) throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
  return betterAuth({
    appName: "Internly",
    database,
    secret,
    baseURL,
    trustedOrigins: [new URL(baseURL).origin],
    emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128 },
    user: { additionalFields: { role: { type: "string", required: true, defaultValue: "student", input: false } } },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 60 },
    advanced: { defaultCookieAttributes: { httpOnly: true, sameSite: "lax" } },
  });
}

let instance: ReturnType<typeof createAuthentication> | undefined;
let connection: DatabaseSync | Pool | undefined;
export function getAuth() {
  if (instance) return instance;
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!secret || !baseURL) throw new Error("Run npm run auth:setup to configure authentication.");
  if (process.env.AUTH_DB_MODE === "postgres") {
    if (!process.env.AUTH_DATABASE_URL) throw new Error("AUTH_DATABASE_URL is required.");
    connection = new Pool({ connectionString: process.env.AUTH_DATABASE_URL, max: 3, connectionTimeoutMillis: 8000,
      ssl: { rejectUnauthorized: true, ca: readFileSync(join(process.cwd(), "certs/supabase-ca.crt"), "utf8") } });
  } else {
    if (process.env.VERCEL || process.env.AUTH_DB_MODE !== "local") throw new Error("Configure a persistent authentication database.");
    mkdirSync(join(process.cwd(), ".data"), { recursive: true });
    connection = new DatabaseSync(join(process.cwd(), ".data/auth.sqlite"));
    connection.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
  }
  instance = createAuthentication(connection, secret, baseURL);
  return instance;
}
