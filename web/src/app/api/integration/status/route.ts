import { randomUUID } from "node:crypto";
import { json } from "@/lib/core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const timestamp = new Date().toISOString();
  const request_id = randomUUID();
  console.info(JSON.stringify({ action: "provider_request", request_id, timestamp, method: "GET", path: "/api/integration/status", status: 200 }));
  return json({ success: true, request_id, data: { team: process.env.TEAM_NAME ?? "team17-internship-management", service: process.env.SERVICE_NAME ?? "internship-management-integration", version: process.env.SERVICE_VERSION ?? "0.1", status: "ok", timestamp } });
}

