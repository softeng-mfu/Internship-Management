import { test } from "node:test";
import assert from "node:assert/strict";
import { getJob, listJobs, JOB_BOARD_URL } from "../src/lib/job-board";

const job = {
  job_id: 6, employer_id: 1, title: "Backend Developer Intern", description: "Build APIs",
  company_name: "Siam TechWorks", category: "IT & Software", location: "Remote", province: "Chiang Rai",
  status: "open", work_type: "Internship", salary_range: "12,000-15,000 THB",
  application_deadline: "2099-03-31", required_skills_en: "TypeScript, SQL, and Git.",
  created_at: "2026-11-02 18:46:53", updated_at: "2026-11-08 10:14:03",
};
const request = (query = "") => new Request("https://internly.example/api/jobs" + query);
function fake(data: unknown[], detail: unknown = job): typeof fetch {
  return async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.origin + "/api/", JOB_BOARD_URL);
    assert.equal(init?.method, "GET");
    assert.equal(init?.redirect, "error");
    assert.ok(init?.signal);
    assert.equal(init?.headers && Object.keys(init.headers).length, 1);
    if (url.pathname === "/api/jobs") {
      assert.equal(url.searchParams.has("lang"), false);
      assert.equal(url.searchParams.get("status"), "open");
      assert.equal(url.searchParams.get("work_type"), "Internship");
      return Response.json({ success: true, count: data.length, data });
    }
    assert.equal(url.pathname, "/api/jobs/6");
    return Response.json({ success: true, data: detail });
  };
}
test("browse exposes only current open internships and preserves provenance", async () => {
  const response = await listJobs(request(), fake([job,
    { ...job, job_id: 7, status: "closed" }, { ...job, job_id: 8, work_type: "Full-time" },
    { ...job, job_id: 9, application_deadline: "2000-01-01" }]));
  const body = await response.json();
  assert.equal(body.pagination.total, 1);
  assert.equal(body.data[0].id, "jobboard-6");
  assert.equal(body.data[0].source_job_id, 6);
  assert.equal(body.data[0].is_demo, true);
  assert.equal(body.meta.data_source, "team18-job-board");
  assert.equal(body.data[0].salary_text, job.salary_range);
  assert.equal(body.data[0].allowance_thb, null);
});
test("search matches skills, companies, province and exact provider category", async () => {
  const body = await (await listJobs(request("?q=sql&location=chiang&category=IT%20%26%20Software&work_mode=remote"), fake([job]))).json();
  assert.equal(body.data.length, 1);
  assert.deepEqual(body.meta.categories, ["IT & Software"]);
  assert.equal((await (await listJobs(request("?q=missing"), fake([job]))).json()).pagination.total, 0);
});
test("local pagination retains totals and bounds", async () => {
  const body = await (await listJobs(request("?limit=1&page=2"), fake([job, { ...job, job_id: 10 }]))).json();
  assert.equal(body.data[0].id, "jobboard-10");
  assert.equal(body.pagination.total, 2);
  assert.equal(body.pagination.has_next, false);
});
test("invalid filters never call the provider", async () => {
  const never: typeof fetch = async () => { throw new Error("must not fetch"); };
  for (const query of ["?page=0", "?limit=51", "?q=a&q=b", "?token=secret", "?status=closed", "?work_mode=office"])
    assert.equal((await listJobs(request(query), never)).status, 400);
});
test("detail resolves employer from public list and preserves free text skills", async () => {
  const { company_name: _, ...detail } = job;
  const response = await getJob(request(), "jobboard-6", fake([job], detail));
  const { data } = await response.json();
  assert.equal(data.company, "Siam TechWorks");
  assert.equal(data.required_skills, job.required_skills_en);
  assert.deepEqual(data.skills, []);
  assert.equal(data.details_url, `${new URL(process.env.PUBLIC_SITE_URL || request().url).origin}/opportunities/jobboard-6`);
});
test("missing values are not invented; Thai skill fallback is kept", async () => {
  const body = await (await getJob(request(), "6", fake([], {
    ...job, application_deadline: null, location: "Bangkok", salary_range: null,
    required_skills_en: null, required_skills_th: "ทักษะภาษาไทย",
  }))).json();
  assert.equal(body.data.application_deadline, null);
  assert.equal(body.data.duration_weeks, null);
  assert.equal(body.data.work_mode, "unspecified");
  assert.equal(body.data.salary_text, null);
  assert.equal(body.data.required_skills, "ทักษะภาษาไทย");
});
test("closed, expired and non-internship detail return 404", async () => {
  for (const patch of [{ status: "closed" }, { application_deadline: "2000-01-01" }, { work_type: "Full-time" }])
    assert.equal((await getJob(request(), "6", fake([], { ...job, ...patch }))).status, 404);
});
test("invalid and mismatched IDs cannot fetch arbitrary paths", async () => {
  for (const id of ["../applications", "0", "6?token=x", "jobboard--6"])
    assert.equal((await getJob(request(), id, fake([]))).status, 400);
  assert.equal((await getJob(request(), "6", fake([], { ...job, job_id: 7 }))).status, 503);
});
test("upstream not found remains 404", async () => {
  assert.equal((await getJob(request(), "6", async () => new Response(null, { status: 404 }))).status, 404);
});
test("network, HTTP, invalid JSON and schema failures return retryable 503 without demo fallback", async () => {
  const fetchers: typeof fetch[] = [
    async () => { throw new Error("private network details"); },
    async () => new Response(null, { status: 500 }),
    async () => new Response("not JSON"),
    async () => Response.json({ success: true, data: [{ job_id: 6 }] }),
    async () => Response.json({ success: false, data: [] }),
  ];
  for (const fetcher of fetchers) {
    const response = await listJobs(request(), fetcher);
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.error.retryable, true);
    assert.equal(body.data, undefined);
    assert.doesNotMatch(JSON.stringify(body), /private network/);
  }
});

test("English display fields take priority without excluding bilingual or Thai-only records", async () => {
  const body = await (await listJobs(request(), fake([
    { ...job, title: "ภาษาไทย", title_en: "English title", description_en: "English description" },
    { ...job, job_id: 7, title: "ภาษาไทย", title_en: null },
  ]))).json();
  assert.equal(body.data.length, 2);
  assert.equal(body.data[0].title, "English title");
  assert.equal(body.data[0].description, "English description");
  assert.equal(body.data[1].title, "ภาษาไทย");
});
