import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import {
  listPlacements,
  getPlacement,
  placementOptions,
} from "../src/lib/placements-service";

test("public placements API against the actual PostgreSQL migration", async (t) => {
  const db = new PGlite();
  const originalMode = process.env.PLACEMENTS_DB_MODE,
    originalOrigin = process.env.PUBLIC_SITE_URL;
  process.env.PLACEMENTS_DB_MODE = "local";
  delete process.env.PUBLIC_SITE_URL;
  const id = (n: number) =>
    `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const provider = async () => db;
  const request = (query = "") =>
    new Request("https://internships.example/api/placements" + query);
  try {
    await db.exec(
      await readFile(
        new URL(
          "../../supabase/migrations/202611070001_public_placements.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    for (let n = 1; n <= 9; n++) {
      await db.query(
        `insert into placements(id,title,company,description,location,category,work_mode,skills,allowance_thb,application_deadline,publication_status,status,published_at,is_demo)
        values($1,$2,'Example Company','Private employee details must never be selected from internal columns','Bangkok','Engineering','remote',array['React','SQL'],12000,
        (now() at time zone 'Asia/Bangkok')::date + $3::int,$4,$5,now()+$6::interval,true)`,
        [
          id(n),
          n === 1 ? "React Engineer's Intern" : "Backend Intern " + n,
          n === 7 ? -1 : n === 9 ? 0 : 30,
          n === 4 ? "draft" : n === 5 ? "archived" : "published",
          n === 6 ? "closed" : "open",
          n === 8 ? "1 day" : "-1 day",
        ],
      );
    }
    await db.exec(
      "alter table placements add column internal_contact text default 'do-not-expose@example.test'",
    );
    await t.test(
      "only open published current records; stable pagination and allowlisted fields",
      async () => {
        const r = await listPlacements(request("?limit=2"), provider);
        assert.equal(r.status, 200);
        const b = await r.json();
        assert.equal(b.pagination.total, 4);
        assert.equal(b.pagination.total_pages, 2);
        assert.equal(b.pagination.has_next, true);
        assert.equal(b.data.length, 2);
        assert.equal(b.data[0].id, id(9));
        assert.equal(b.meta.data_source, "local-postgresql");
        assert.equal(r.headers.get("X-Request-Id"), b.meta.request_id);
        assert.equal(
          b.data[0].details_url,
          "https://internships.example/opportunities/" + id(9),
        );
        assert.match(b.data[0].application_deadline, /^\d{4}-\d{2}-\d{2}$/);
        assert.equal("internal_contact" in b.data[0], false);
        assert.equal("publication_status" in b.data[0], false);
        const second = await (
          await listPlacements(request("?limit=2&page=2"), provider)
        ).json();
        assert.equal(second.data.length, 2);
        assert.equal(second.pagination.has_next, false);
        assert.equal(
          new Set([...b.data, ...second.data].map((p) => p.id)).size,
          4,
        );
        assert.equal(r.headers.get("Access-Control-Allow-Origin"), "*");
      },
    );
    await t.test(
      "combined case-insensitive filters and literal SQL-like text",
      async () => {
        const b = await (
          await listPlacements(
            request(
              "?q=React&location=bang&category=engineering&work_mode=remote&status=open",
            ),
            provider,
          )
        ).json();
        assert.equal(b.pagination.total, 4);
        const exact = await (
          await listPlacements(
            request("?q=" + encodeURIComponent("Engineer's")),
            provider,
          )
        ).json();
        assert.equal(exact.data.length, 1);
        for (const input of ["' OR 1=1 --", "%", "_"]) {
          const result = await (
            await listPlacements(
              request("?q=" + encodeURIComponent(input)),
              provider,
            )
          ).json();
          assert.equal(result.pagination.total, 0);
        }
      },
    );
    await t.test(
      "empty and out-of-range pages retain total count",
      async () => {
        const empty = await (
          await listPlacements(request("?q=nonexistent"), provider)
        ).json();
        assert.deepEqual(empty.data, []);
        assert.equal(empty.pagination.total_pages, 0);
        const beyond = await (
          await listPlacements(request("?page=999&limit=2"), provider)
        ).json();
        assert.deepEqual(beyond.data, []);
        assert.equal(beyond.pagination.total, 4);
        assert.equal(beyond.pagination.has_next, false);
      },
    );
    await t.test(
      "reject invalid and repeated parameters before touching storage",
      async () => {
        let contacted = false;
        const unused = async () => {
          contacted = true;
          return db;
        };
        for (const query of [
          "?page=0",
          "?limit=51",
          "?page=1.5",
          "?page=1e2",
          "?page=10001",
          "?limit=",
          "?status=closed",
          "?status=",
          "?work_mode=office",
          "?foo=bar",
          "?page=1&page=2",
          "?q=" + "x".repeat(101),
        ]) {
          const r = await listPlacements(request(query), unused);
          assert.equal(r.status, 400, query);
          assert.equal((await r.json()).error.code, "INVALID_QUERY");
        }
        assert.equal(contacted, false);
      },
    );
    await t.test(
      "details apply the same visibility rules and validate UUIDs",
      async () => {
        const r = await getPlacement(
          new Request("https://internships.example/api/placements/" + id(1)),
          id(1),
          provider,
        );
        assert.equal(r.status, 200);
        assert.equal((await r.json()).data.id, id(1));
        for (const n of [4, 5, 6, 7, 8, 100])
          assert.equal(
            (await getPlacement(request(), id(n), provider)).status,
            404,
          );
        assert.equal(
          (await getPlacement(request(), "bad-id", provider)).status,
          400,
        );
        assert.equal(
          (await getPlacement(request("?q=React"), id(1), provider)).status,
          400,
        );
      },
    );
    await t.test(
      "storage failure gives a bounded redacted error with correlation ID",
      async () => {
        const broken = async () => {
          throw new Error("password=do-not-return-me");
        };
        for (const r of [
          await listPlacements(request(), broken),
          await getPlacement(request(), id(1), broken),
        ]) {
          assert.equal(r.status, 503);
          const b = await r.json();
          assert.equal(b.error.code, "PLACEMENTS_UNAVAILABLE");
          assert.equal(b.error.retryable, true);
          assert.ok(b.meta.request_id);
          assert.ok(!JSON.stringify(b).includes("do-not-return-me"));
        }
        assert.equal(placementOptions().status, 204);
      },
    );
    await t.test(
      "publication integrity and default-deny RLS are installed",
      async () => {
        const flags = await db.query<{ relrowsecurity: boolean }>(
          "select relrowsecurity from pg_class where oid='public.placements'::regclass",
        );
        assert.equal(flags.rows[0].relrowsecurity, true);
        await assert.rejects(() =>
          db.query("update placements set published_at=null where id=$1", [
            id(1),
          ]),
        );
        await assert.rejects(() =>
          db.query("update placements set work_mode='invalid' where id=$1", [
            id(1),
          ]),
        );
      },
    );
  } finally {
    if (originalMode === undefined) delete process.env.PLACEMENTS_DB_MODE;
    else process.env.PLACEMENTS_DB_MODE = originalMode;
    if (originalOrigin === undefined) delete process.env.PUBLIC_SITE_URL;
    else process.env.PUBLIC_SITE_URL = originalOrigin;
    await db.close();
  }
});
