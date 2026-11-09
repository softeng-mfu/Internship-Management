import { listJobs } from "@/lib/job-board";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: Request) { return listJobs(request); }
