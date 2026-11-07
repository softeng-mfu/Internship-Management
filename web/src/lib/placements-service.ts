import { randomUUID } from "node:crypto";
import type { Placement } from "./placement-types";
export interface CatalogueDatabase {
  query<T extends Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>;
}
export type CatalogueProvider = () => Promise<CatalogueDatabase>;
class CatalogueError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
const publicColumns = `id,title,company,description,location,category,work_mode,skills,allowance_thb,
  duration_weeks,application_deadline::text,status,is_demo,published_at,updated_at`;
const visibility = `publication_status = 'published' and published_at is not null
  and published_at <= now() and status = 'open'
  and application_deadline >= (now() at time zone 'Asia/Bangkok')::date`;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function decorate(row: Record<string, unknown>, request: Request): Placement {
  const origin = new URL(process.env.PUBLIC_SITE_URL || request.url);
  if (!["http:", "https:"].includes(origin.protocol))
    throw new Error("Invalid public site URL");
  return {
    ...row,
    published_at: new Date(String(row.published_at)).toISOString(),
    updated_at: new Date(String(row.updated_at)).toISOString(),
    details_url: new URL(`/opportunities/${row.id}`, origin.origin).href,
  } as Placement;
}
function response(body: unknown, status: number, requestId: string) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "X-Request-Id",
      "X-Request-Id": requestId,
    },
  });
}
function parse(request: Request) {
  const p = new URL(request.url).searchParams;
  const allowed = new Set([
    "page",
    "limit",
    "q",
    "location",
    "category",
    "work_mode",
    "status",
  ]);
  for (const key of p.keys())
    if (!allowed.has(key) || p.getAll(key).length !== 1)
      throw new CatalogueError(
        400,
        "INVALID_QUERY",
        "Unknown or repeated query parameter: " + key,
      );
  function integer(key: string, fallback: number, max: number) {
    const raw = p.get(key);
    if (raw === null) return fallback;
    if (!/^[1-9]\d*$/.test(raw) || Number(raw) > max)
      throw new CatalogueError(
        400,
        "INVALID_QUERY",
        `${key} must be an integer from 1 to ${max}.`,
      );
    return Number(raw);
  }
  function text(key: string, max: number) {
    const value = (p.get(key) || "").trim();
    if (value.length > max)
      throw new CatalogueError(
        400,
        "INVALID_QUERY",
        `${key} is too long (maximum ${max} characters).`,
      );
    return value;
  }
  const mode = text("work_mode", 20),
    status = text("status", 20);
  if (mode && !["remote", "hybrid", "on-site"].includes(mode))
    throw new CatalogueError(
      400,
      "INVALID_QUERY",
      "work_mode must be remote, hybrid or on-site.",
    );
  if (p.has("status") && status !== "open")
    throw new CatalogueError(
      400,
      "INVALID_QUERY",
      "Only status=open is supported.",
    );
  return {
    page: integer("page", 1, 10000),
    limit: integer("limit", 12, 50),
    q: text("q", 100),
    location: text("location", 100),
    category: text("category", 60),
    mode,
  };
}
async function execute(request: Request, work: () => Promise<unknown>) {
  const id = randomUUID();
  const started = Date.now();
  let status = 200;
  const meta = {
    api_version: "1.0",
    request_id: id,
    timestamp: new Date().toISOString(),
    data_source:
      process.env.PLACEMENTS_DB_MODE === "local"
        ? "local-postgresql"
        : "postgresql",
  };
  try {
    return response(
      { success: true, ...((await work()) as object), meta },
      200,
      id,
    );
  } catch (error) {
    const e =
      error instanceof CatalogueError
        ? error
        : new CatalogueError(
            503,
            "PLACEMENTS_UNAVAILABLE",
            "Internship listings are temporarily unavailable. Please try again later.",
          );
    status = e.status;
    return response(
      {
        success: false,
        error: { code: e.code, message: e.message, retryable: status === 503 },
        meta,
      },
      status,
      id,
    );
  } finally {
    console.info(
      JSON.stringify({
        action: "placements_request",
        request_id: id,
        path: new URL(request.url).pathname,
        method: "GET",
        status,
        duration_ms: Date.now() - started,
        timestamp: meta.timestamp,
      }),
    );
  }
}
export function listPlacements(request: Request, provider: CatalogueProvider) {
  return execute(request, async () => {
    const f = parse(request);
    const params: unknown[] = [];
    let where = visibility;
    function add(value: string, predicate: (parameter: string) => string) {
      if (value) {
        params.push(value);
        where += " and " + predicate("$" + params.length);
      }
    }
    add(
      f.q,
      (p) =>
        `position(lower(${p}) in lower(title || ' ' || company || ' ' || description || ' ' || array_to_string(skills,' '))) > 0`,
    );
    add(f.location, (p) => `position(lower(${p}) in lower(location)) > 0`);
    add(f.category, (p) => `lower(category) = lower(${p})`);
    add(f.mode, (p) => `work_mode = ${p}`);
    params.push(f.limit, (f.page - 1) * f.limit);
    const db = await provider();
    const result = await db.query<{
      total: number;
      items: Record<string, unknown>[];
    }>(
      `with matching as (
      select ${publicColumns} from public.placements where ${where}
    ), page_rows as (select * from matching order by application_deadline asc,id asc limit $${params.length - 1} offset $${params.length})
    select (select count(*)::int from matching) as total,
      coalesce((select jsonb_agg(to_jsonb(page_rows) order by application_deadline,id) from page_rows),'[]'::jsonb) as items`,
      params,
    );
    const { total, items } = result.rows[0];
    return {
      data: items.map((item) => decorate(item, request)),
      pagination: {
        page: f.page,
        limit: f.limit,
        total,
        total_pages: Math.ceil(total / f.limit),
        has_next: f.page * f.limit < total,
      },
    };
  });
}
export function getPlacement(
  request: Request,
  id: string,
  provider: CatalogueProvider,
) {
  return execute(request, async () => {
    if (!uuid.test(id))
      throw new CatalogueError(
        400,
        "INVALID_ID",
        "Placement ID must be a UUID.",
      );
    if (new URL(request.url).search)
      throw new CatalogueError(
        400,
        "INVALID_QUERY",
        "The detail endpoint does not accept query parameters.",
      );
    const result = await (
      await provider()
    ).query<Record<string, unknown>>(
      `select ${publicColumns} from public.placements where ${visibility} and id=$1`,
      [id],
    );
    if (!result.rows.length)
      throw new CatalogueError(
        404,
        "PLACEMENT_NOT_FOUND",
        "This opportunity is unavailable or no longer open.",
      );
    return { data: decorate(result.rows[0], request) };
  });
}
export function placementOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Accept",
      "Access-Control-Max-Age": "600",
    },
  });
}
