import "server-only";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { CatalogueDatabase } from "./placements-service";

const state = globalThis as typeof globalThis & {
  catalogueDb?: Promise<CatalogueDatabase>;
};
export function placementsDatabase(): Promise<CatalogueDatabase> {
  return (state.catalogueDb ??= open().catch((error) => {
    state.catalogueDb = undefined;
    throw error;
  }));
}
async function open(): Promise<CatalogueDatabase> {
  if (process.env.PLACEMENTS_DB_MODE === "local") {
    // Filesystem PostgreSQL is for local development only. Never use on serverless hosts.
    if (process.env.VERCEL)
      throw new Error("Local placements database is unavailable on Vercel");
    const path = join(process.cwd(), ".data", "placements");
    mkdirSync(path, { recursive: true });
    const db = new PGlite(path);
    await db.exec("set default_transaction_read_only = on");
    return { query: (text, params) => db.query(text, params) };
  }
  if (process.env.PLACEMENTS_DB_MODE !== "postgres")
    throw new Error("Set PLACEMENTS_DB_MODE");
  const url = process.env.PLACEMENTS_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("Missing placements database URL");
  const sql = postgres(url, {
    ssl: {
      ca: readFileSync(join(process.cwd(), "certs/supabase-ca.crt"), "utf8"),
      rejectUnauthorized: true,
    },
    max: 2,
    prepare: false,
    connect_timeout: 8,
    idle_timeout: 20,
    connection: {
      default_transaction_read_only: true,
      statement_timeout: 8000,
    },
  });
  return {
    async query<T extends Record<string, unknown>>(
      text: string,
      params: unknown[] = [],
    ) {
      const rows = await sql.unsafe<T[]>(text, params as never[]);
      return { rows: Array.from(rows) };
    },
  };
}
