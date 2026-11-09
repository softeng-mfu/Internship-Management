import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { getMigrations } from "better-auth/db/migration";
import { hashPassword } from "better-auth/crypto";

async function main() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  if (process.env.AUTH_DB_MODE === "postgres" || process.env.VERCEL) throw new Error("This bootstrap is for local development only.");
  const settings: Record<string, string> = {
    AUTH_DB_MODE: "local",
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://127.0.0.1:3001",
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || randomBytes(48).toString("base64url"),
  };
  for (const [key, value] of Object.entries(settings)) {
    if (!process.env[key]) appendFileSync(".env.local", `\n${key}=${value}\n`);
    process.env[key] = value;
  }
  const { getAuth } = await import("../src/lib/auth");
  const auth = getAuth();
  await (await getMigrations(auth.options)).runMigrations();
  const context = await auth.$context;
  const email = "admin@internly.local";
  const existing = await context.internalAdapter.findUserByEmail(email);
  if (!existing) {
    const password = randomBytes(24).toString("base64url");
    const created = await context.internalAdapter.createUser({ email, name: "Internly Administrator", emailVerified: false, role: "admin", authSource: "local" }, { method: "custom" });
    await context.internalAdapter.createAccount({ userId: created.id, providerId: "credential", accountId: created.id, password: await hashPassword(password) });
    writeFileSync(".env.auth-admin.local", `# Private local administrator credentials. Never commit or share this file.\nADMIN_EMAIL=${email}\nADMIN_PASSWORD=${password}\n`, { flag: "wx" });
    console.log("Local administrator created. Credentials are in .env.auth-admin.local (ignored by git).");
  } else console.log("Existing administrator account preserved; no password or role was changed.");
  const { workspaceStore } = await import("../src/lib/workspace");
  const { getApplicationDatabase } = await import("../src/lib/auth");
  await workspaceStore(getApplicationDatabase()).migrate();
  console.log("Authentication database is ready.");
}
main().catch(() => { console.error("Authentication setup failed. Check local auth configuration and database permissions."); process.exitCode = 1; });
