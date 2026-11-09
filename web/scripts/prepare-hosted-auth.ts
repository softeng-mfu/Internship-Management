// Explicit production setup; credentials are saved only to ignored local files.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { getMigrations } from "better-auth/db/migration";
import { createAuthentication } from "../src/lib/auth";
import { workspaceStore } from "../src/lib/workspace";

async function main() {
  process.loadEnvFile(".env.local");
  const ssl = { ca: readFileSync("certs/supabase-ca.crt", "utf8"), rejectUnauthorized: true };
  const adminURL = new URL(process.env.DATABASE_URL!);
  const admin = new Pool({ connectionString: adminURL.href, ssl, max: 1, connectionTimeoutMillis: 10000 });
  let runtime: Pool | undefined;
  try {
    const role = "team17_auth_service";
    const file = ".env.auth-production.local";
    let values: Record<string, string>;
    if (existsSync(file)) values = Object.fromEntries(readFileSync(file,"utf8").split(/\r?\n/).filter(l=>l.includes("=")&&!l.startsWith("#")).map(l=>[l.slice(0,l.indexOf("=")),l.slice(l.indexOf("=")+1)]));
    else {
      const found = await admin.query("select 1 from pg_roles where rolname=$1", [role]);
      if (found.rowCount) throw new Error("Existing auth role needs its saved configuration; refusing credential rotation.");
      const password = randomBytes(32).toString("hex");
      await admin.query(`create role ${role} login password '${password}' nosuperuser nocreatedb nocreaterole noinherit nobypassrls`);
      const url = new URL(adminURL);
      url.hostname = "aws-0-ap-south-1.pooler.supabase.com"; url.port = "6543";
      url.username = role + "." + adminURL.hostname.split(".")[1]; url.password = password;
      values = { AUTH_DB_MODE:"postgres", AUTH_DATABASE_URL:url.href, BETTER_AUTH_URL:"https://team17-internship.vercel.app", BETTER_AUTH_SECRET:randomBytes(48).toString("base64url") };
      writeFileSync(file, Object.entries(values).map(([k,v])=>`${k}=${v}`).join("\n")+"\n", { mode:0o600, flag:"wx" });
    }
    await admin.query("create schema if not exists internly_auth");
    await admin.query(`grant usage, create on schema internly_auth to ${role}`);
    await admin.query(`alter role ${role} set search_path = internly_auth`);
    runtime = new Pool({ connectionString: values.AUTH_DATABASE_URL, ssl, max:1, connectionTimeoutMillis:10000 });
    const schema = await runtime.query("select current_schema() as name");
    if (schema.rows[0].name !== "internly_auth") throw new Error("Auth schema isolation check failed.");
    const auth = createAuthentication(runtime, values.BETTER_AUTH_SECRET, values.BETTER_AUTH_URL);
    await (await getMigrations(auth.options)).runMigrations();
    await workspaceStore(runtime).migrate();
    const tables = await runtime.query("select count(*)::int as count from information_schema.tables where table_schema='internly_auth'");
    console.log(JSON.stringify({ ready:true, schema:"internly_auth", tables:tables.rows[0].count, credentials:"saved privately" }));
  } finally { await runtime?.end(); await admin.end(); }
}
main().catch(error=>{ console.error("Hosted authentication setup failed:", error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/\S+/g,"[redacted]") : "Unknown error"); process.exitCode=1; });
