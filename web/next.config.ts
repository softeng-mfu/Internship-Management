import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  outputFileTracingIncludes: {
    "/api/placements/**": ["./certs/supabase-ca.crt"],
    "/opportunities/**": ["./certs/supabase-ca.crt"],
    "/api/integration/activity": ["./certs/supabase-ca.crt"],
  },
};
export default config;
