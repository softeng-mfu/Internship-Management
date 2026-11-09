import type { NextConfig } from "next";
const config: NextConfig = {
  // Bound build concurrency on development machines using the WASM fallback.
  experimental: { cpus: 2 },
  serverExternalPackages: ["@electric-sql/pglite", "postgres", "pg"],
  outputFileTracingIncludes: {
    "/api/placements/**": ["./certs/supabase-ca.crt"],
    "/opportunities/**": ["./certs/supabase-ca.crt"],
    "/api/integration/activity": ["./certs/supabase-ca.crt"],
    "/api/auth/**": ["./certs/supabase-ca.crt"],
    "/api/identity/**": ["./certs/supabase-ca.crt"],
  },
};
export default config;
