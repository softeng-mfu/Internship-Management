import "server-only";
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Only used by the operator-protected activity route. No database writes.
const globalSql = globalThis as typeof globalThis & {
  activitySql?: ReturnType<typeof postgres>;
};
export function activityDatabase() {
  if (!process.env.DATABASE_URL)
    throw new Error("Database connection is not configured");
  return (globalSql.activitySql ??= postgres(process.env.DATABASE_URL, {
    ssl: {
      ca: readFileSync(join(process.cwd(), "certs/supabase-ca.crt"), "utf8"),
      rejectUnauthorized: true,
    },
    max: 2,
    connect_timeout: 8,
    idle_timeout: 20,
    connection: {
      default_transaction_read_only: true,
      statement_timeout: 8000,
    },
  }));
}
