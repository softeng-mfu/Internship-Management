import "server-only";
import { createClient } from "@supabase/supabase-js";
import { ApiError, required } from "./core";

export function database() {
  return createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000) }) },
  });
}
export async function rpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await database().rpc(name, args);
  if (error) throw new ApiError(503, "STORAGE_UNAVAILABLE", "Database operation failed.", true);
  return data;
}
export async function log(action: string, details: Record<string, unknown>) {
  const record = { action, details, created_at: new Date().toISOString() };
  console.info(JSON.stringify(record));
  // Provider and failure evidence remains in hosting logs even if Supabase is unavailable.
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const { error } = await database().from("a5_integration_logs").insert(record);
    if (error) console.warn("Integration log persistence unavailable");
  } catch { console.warn("Integration log persistence unavailable"); }
}

