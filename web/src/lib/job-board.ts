import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Placement } from "./placement-types";

// Only these public, read-only endpoints are used. No credentials or student data are sent.
export const JOB_BOARD_URL = "https://team18-job-board-api.tawee-dev.workers.dev/api/";
const jobSchema = z.object({
  job_id: z.number().int().positive(),
  employer_id: z.number().int().positive(),
  title: z.string(), description: z.string(), category: z.string(),
  title_en: z.string().nullish(), description_en: z.string().nullish(),
  location: z.string(), province: z.string(), status: z.string(), work_type: z.string(),
  company_name: z.string().nullish(), salary_range: z.string().nullish(),
  application_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  required_skills_en: z.string().nullish(), required_skills_th: z.string().nullish(),
  responsibilities_en: z.string().nullish(), responsibilities_th: z.string().nullish(),
  qualifications_en: z.string().nullish(), qualifications_th: z.string().nullish(),
  benefits_en: z.string().nullish(), benefits_th: z.string().nullish(),
  created_at: z.string(), updated_at: z.string(),
});
type Job = z.infer<typeof jobSchema>;
type Fetcher = typeof fetch;
class JobError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
async function read(path: string, fetcher: Fetcher) {
  const response = await fetcher(new URL(path, JOB_BOARD_URL), {
    method: "GET", headers: { Accept: "application/json" }, cache: "no-store",
    signal: AbortSignal.timeout(10000), redirect: "error",
  });
  if (response.status === 404 && path.startsWith("jobs/"))
    throw new JobError(404, "JOB_NOT_FOUND", "This internship is unavailable or no longer open.");
  if (!response.ok) throw new Error("Job Board request failed");
  return response.json();
}
async function catalogue(fetcher: Fetcher) {
  const body = z.object({ success: z.literal(true), data: z.array(jobSchema) }).parse(
    await read("jobs?status=open&work_type=Internship", fetcher),
  );
  return body.data;
}
function available(job: Job) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  return job.status === "open" && job.work_type === "Internship" &&
    (!job.application_deadline || job.application_deadline >= today);
}
function mapJob(job: Job, request: Request): Placement {
  const id = `jobboard-${job.job_id}`;
  return {
    id, title: job.title_en || job.title, company: job.company_name || "Employer not specified",
    description: job.description_en || job.description, location: [...new Set([job.location, job.province].filter(Boolean))].join(", "),
    category: job.category,
    work_mode: /^remote$/i.test(job.location) ? "remote" : "unspecified",
    skills: [], required_skills: job.required_skills_en || job.required_skills_th || null,
    responsibilities: job.responsibilities_en || job.responsibilities_th || null,
    qualifications: job.qualifications_en || job.qualifications_th || null,
    benefits: job.benefits_en || job.benefits_th || null,
    allowance_thb: null, salary_text: job.salary_range || null,
    duration_weeks: null, application_deadline: job.application_deadline || null,
    status: "open", is_demo: true, published_at: job.created_at, updated_at: job.updated_at,
    details_url: new URL(`/opportunities/${id}`, process.env.PUBLIC_SITE_URL || request.url).href,
    source: "team18-job-board", source_job_id: job.job_id,
  };
}
function filters(request: Request) {
  const params = new URL(request.url).searchParams;
  const allowed = ["q", "location", "category", "work_mode", "status", "page", "limit"];
  for (const [key, value] of params) {
    if (!allowed.includes(key) || params.getAll(key).length !== 1 || value.length > 100)
      throw new JobError(400, "INVALID_QUERY", "Unknown, repeated, or oversized filter.");
  }
  function integer(key: string, fallback: number, max: number) {
    const raw = params.get(key);
    if (raw === null) return fallback;
    if (!/^[1-9]\d*$/.test(raw) || Number(raw) > max)
      throw new JobError(400, "INVALID_QUERY", `Invalid ${key}.`);
    return Number(raw);
  }
  if ((params.has("status") && params.get("status") !== "open") ||
    (params.get("work_mode") && !["remote", "hybrid", "on-site", "unspecified"].includes(params.get("work_mode")!)))
    throw new JobError(400, "INVALID_QUERY", "Unsupported status or work arrangement.");
  return { params, page: integer("page", 1, 10000), limit: integer("limit", 12, 50) };
}
async function respond(work: () => Promise<object>) {
  const meta = { api_version: "1.0", request_id: randomUUID(), timestamp: new Date().toISOString(), data_source: "team18-job-board" };
  try {
    const result = await work();
    return Response.json({ success: true, ...result, meta: { ...meta, ...("categories" in result ? { categories: result.categories } : {}) } },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const e = error instanceof JobError ? error : new JobError(503, "JOB_BOARD_UNAVAILABLE", "Job Board listings are temporarily unavailable. Please try again.");
    return Response.json({ success: false, error: { code: e.code, message: e.message, retryable: e.status === 503 }, meta },
      { status: e.status, headers: { "Cache-Control": "no-store" } });
  }
}
export function listJobs(request: Request, fetcher: Fetcher = fetch) {
  return respond(async () => {
    const { params, page, limit } = filters(request);
    const all = (await catalogue(fetcher)).filter(available).map(job => mapJob(job, request));
    const categories = [...new Set(all.map(job => job.category))].sort();
    const q = (params.get("q") || "").trim().toLowerCase();
    const location = (params.get("location") || "").trim().toLowerCase();
    const category = params.get("category");
    const mode = params.get("work_mode");
    const matching = all.filter(job =>
      (!q || [job.title, job.company, job.description, job.required_skills || ""].join(" ").toLowerCase().includes(q)) &&
      (!location || job.location.toLowerCase().includes(location)) &&
      (!category || job.category === category) && (!mode || job.work_mode === mode));
    const total = matching.length;
    return { data: matching.slice((page - 1) * limit, page * limit), categories,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit), has_next: page * limit < total } };
  });
}
export function getJob(request: Request, id: string, fetcher: Fetcher = fetch) {
  return respond(async () => {
    const match = /^(?:jobboard-)?([1-9]\d{0,9})$/.exec(id);
    if (!match || new URL(request.url).search)
      throw new JobError(400, "INVALID_ID", "A valid Job Board ID without query parameters is required.");
    const job = z.object({ success: z.literal(true), data: jobSchema }).parse(await read(`jobs/${match[1]}`, fetcher)).data;
    if (String(job.job_id) !== match[1]) throw new Error("Mismatched Job Board ID");
    if (!available(job)) throw new JobError(404, "JOB_NOT_FOUND", "This internship is unavailable or no longer open.");
    // The detail response omits company_name; resolve it using the public list.
    if (!job.company_name) {
      const listing = (await catalogue(fetcher)).find(item => item.job_id === job.job_id && item.employer_id === job.employer_id);
      job.company_name = listing?.company_name;
    }
    return { data: mapJob(job, request) };
  });
}
