import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";
import { z } from "zod";
import { ApiError } from "./core";

export type Actor = {
  id: string;
  role: string;
  name: string;
  studentId?: string | null;
  authSource?: string | null;
};
export function workspaceStore(database: DatabaseSync | Pool) {
  async function query(
    sql: string,
    values: (string | number | null)[] = [],
  ): Promise<Record<string, unknown>[]> {
    if (database instanceof DatabaseSync)
      return database.prepare(sql).all(...values) as Record<string, unknown>[];
    let index = 0;
    return (
      await database.query(
        sql.replace(/\?/g, () => `$${++index}`),
        values,
      )
    ).rows;
  }
  async function migrate() {
    for (const sql of [
      `create table if not exists internship_assignments (student_id text primary key references "user"(id) on delete cascade, advisor_id text not null references "user"(id) on delete cascade, created_at text not null)`,
      `create table if not exists internship_applications (id text primary key, student_id text not null references "user"(id) on delete cascade, placement_id text not null, title text not null, company text not null, statement text not null, status text not null check(status in ('submitted','under_review','approved','rejected')), review_note text not null default '', version integer not null default 1, created_at text not null, updated_at text not null, unique(student_id, placement_id))`,
      `create table if not exists internship_reports (id text primary key, application_id text not null references internship_applications(id) on delete cascade, student_id text not null references "user"(id) on delete cascade, week integer not null check(week between 1 and 52), content text not null, feedback text not null default '', reviewed_at text, version integer not null default 1, created_at text not null, unique(application_id,week))`,
      `create index if not exists internship_assignment_advisor on internship_assignments(advisor_id)`,
      `create index if not exists internship_application_student on internship_applications(student_id)`,
      `create index if not exists internship_report_student on internship_reports(student_id)`,
      `create table if not exists internship_connection_requests (id text primary key, student_id text not null references "user"(id) on delete cascade, advisor_id text not null references "user"(id) on delete cascade, message text not null, status text not null check(status in ('pending','accepted','rejected','cancelled')), created_at text not null, updated_at text not null)`,
      `create unique index if not exists internship_connection_pending on internship_connection_requests(student_id) where status='pending'`,
      `create index if not exists internship_connection_advisor on internship_connection_requests(advisor_id,status)`,
    ])
      await query(sql);
  }
  function authorized(actor: Actor) {
    if (!["student", "advisor", "admin"].includes(actor.role))
      throw new ApiError(403, "FORBIDDEN", "Workspace access denied.");
    if (
      actor.role === "student" &&
      (actor.authSource !== "student-identity" || !actor.studentId)
    )
      throw new ApiError(
        403,
        "IDENTITY_LOGIN_REQUIRED",
        "Sign in using Student Identity to access your real workspace.",
      );
  }
  async function read(actor: Actor) {
    authorized(actor);
    const condition =
      actor.role === "student"
        ? "u.id = ?"
        : actor.role === "advisor"
          ? "x.advisor_id = ?"
          : "1 = 1";
    const values = actor.role === "admin" ? [] : [actor.id];
    const students = await query(
      `select u.id, u.name, u."studentId" as student_number, x.advisor_id from "user" u left join internship_assignments x on x.student_id=u.id where u.role='student' and ${condition} order by u.name limit 200`,
      values,
    );
    const scope =
      actor.role === "student"
        ? "a.student_id = ?"
        : actor.role === "advisor"
          ? "exists(select 1 from internship_assignments x where x.student_id=a.student_id and x.advisor_id=?)"
          : "1 = 1";
    const applications = await query(
      `select a.*,u.name as student_name,u."studentId" as student_number from internship_applications a join "user" u on u.id=a.student_id where ${scope} order by a.created_at desc limit 200`,
      values,
    );
    const reports = await query(
      `select r.*, a.title, a.company, u.name as student_name,u."studentId" as student_number from internship_reports r join internship_applications a on a.id=r.application_id join "user" u on u.id=r.student_id where ${scope} order by r.created_at desc limit 200`,
      values,
    );
    const advisors =
      actor.role === "student"
        ? await query(
            `select u.name from "user" u join internship_assignments x on x.advisor_id=u.id where x.student_id=?`,
            [actor.id],
          )
        : [];
    const directory = actor.role === "student"
      ? await query(`select id,name from "user" where role='advisor' order by name,id`)
      : [];
    const requests = await query(
      `select r.*,s.name as student_name,s."studentId" as student_number,a.name as advisor_name from internship_connection_requests r join "user" s on s.id=r.student_id join "user" a on a.id=r.advisor_id where ${actor.role === "student" ? "r.student_id=?" : actor.role === "advisor" ? "r.advisor_id=?" : "1=1"} order by r.created_at desc`,
      values,
    );
    return {
      role: actor.role,
      students,
      applications,
      reports,
      advisor: advisors[0]?.name || null,
      advisors: directory,
      connectionRequests: requests,
    };
  }
  async function assign(student: string, advisor: string) {
    const users = await query(`select id,role from "user" where id in (?,?)`, [
      student,
      advisor,
    ]);
    if (
      !users.some((u) => u.id === student && u.role === "student") ||
      !users.some((u) => u.id === advisor && u.role === "advisor")
    )
      throw new ApiError(
        400,
        "INVALID_ASSIGNMENT",
        "Choose an existing student and advisor.",
      );
    await query(
      `insert into internship_assignments(student_id,advisor_id,created_at) values(?,?,?) on conflict(student_id) do update set advisor_id=excluded.advisor_id`,
      [student, advisor, new Date().toISOString()],
    );
  }
  async function apply(
    actor: Actor,
    placement: { id: string; title: string; company: string },
    statement: string,
  ) {
    authorized(actor);
    if (actor.role !== "student")
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Only students can submit applications.",
      );
    const id = randomUUID(),
      now = new Date().toISOString();
    const rows = await query(
      `insert into internship_applications(id,student_id,placement_id,title,company,statement,status,created_at,updated_at) values(?,?,?,?,?,?,'submitted',?,?) on conflict(student_id,placement_id) do nothing returning id`,
      [
        id,
        actor.id,
        placement.id,
        placement.title,
        placement.company,
        statement,
        now,
        now,
      ],
    );
    if (!rows.length)
      throw new ApiError(
        409,
        "ALREADY_APPLIED",
        "You already applied for this opportunity.",
      );
    return id;
  }
  async function mutate(actor: Actor, raw: unknown) {
    authorized(actor);
    const id = z.string().uuid();
    const input = z
      .discriminatedUnion("action", [
        z.object({ action: z.literal("requestAdvisor"), advisorId: z.string().min(1).max(128), message: z.string().trim().min(1).max(2000) }).strict(),
        z.object({ action: z.literal("cancelAdvisorRequest"), id }).strict(),
        z.object({ action: z.literal("respondAdvisorRequest"), id, decision: z.enum(["accepted", "rejected"]) }).strict(),
        z
          .object({
            action: z.literal("reviewApplication"),
            id,
            version: z.number().int().positive(),
            status: z.enum(["under_review", "approved", "rejected"]),
            note: z.string().trim().min(1).max(3000),
          })
          .strict(),
        z
          .object({
            action: z.literal("submitReport"),
            applicationId: id,
            week: z.number().int().min(1).max(52),
            content: z.string().trim().min(20).max(10000),
          })
          .strict(),
        z
          .object({
            action: z.literal("reviewReport"),
            id,
            version: z.number().int().positive(),
            feedback: z.string().trim().min(1).max(5000),
          })
          .strict(),
      ])
      .safeParse(raw);
    if (!input.success)
      throw new ApiError(
        400,
        "INVALID_INPUT",
        "Check the connection request, review or report fields.",
      );
    const body = input.data,
      now = new Date().toISOString();
    if (body.action === "requestAdvisor") {
      if (actor.role !== "student") throw new ApiError(403, "FORBIDDEN", "Only students can request an advisor.");
      const rows = await query(
        `insert into internship_connection_requests(id,student_id,advisor_id,message,status,created_at,updated_at) select ?,?,id,?,'pending',?,? from "user" where id=? and role='advisor' and not exists(select 1 from internship_assignments where student_id=?) on conflict do nothing returning id`,
        [randomUUID(), actor.id, body.message, now, now, body.advisorId, actor.id],
      );
      if (!rows.length) throw new ApiError(409, "CONNECTION_UNAVAILABLE", "Choose an available advisor. You may have only one pending request and one assigned advisor.");
      return;
    }
    if (body.action === "cancelAdvisorRequest") {
      if (actor.role !== "student") throw new ApiError(403, "FORBIDDEN", "Only students can cancel their request.");
      const rows = await query(`update internship_connection_requests set status='cancelled',updated_at=? where id=? and student_id=? and status='pending' returning id`, [now, body.id, actor.id]);
      if (!rows.length) throw new ApiError(409, "CONNECTION_UNAVAILABLE", "This request changed or is unavailable. Refresh and try again.");
      return;
    }
    if (body.action === "respondAdvisorRequest") {
      if (actor.role !== "advisor") throw new ApiError(403, "FORBIDDEN", "Only the requested advisor can respond.");
      // Lock the request by updating it first; the assignment and decision commit together.
      const statements = [
        { sql: `update internship_connection_requests set status=?,updated_at=? where id=? and advisor_id=? and status='pending' returning student_id`, values: [body.decision, now, body.id, actor.id] },
        ...(body.decision === "accepted" ? [{ sql: `insert into internship_assignments(student_id,advisor_id,created_at) select student_id,advisor_id,? from internship_connection_requests where id=? and advisor_id=? and status='accepted' on conflict(student_id) do nothing returning student_id`, values: [now, body.id, actor.id] }] : []),
      ];
      const conflict = () => new ApiError(409, "CONNECTION_UNAVAILABLE", "This request changed or the student already has an advisor. Refresh and try again.");
      if (database instanceof DatabaseSync) {
        database.exec("BEGIN IMMEDIATE");
        try {
          for (const statement of statements) if (!database.prepare(statement.sql).all(...statement.values).length) throw conflict();
          database.exec("COMMIT");
        } catch (error) { database.exec("ROLLBACK"); throw error; }
      } else {
        const client = await database.connect();
        try {
          await client.query("BEGIN");
          for (const statement of statements) {
            let index = 0;
            if (!(await client.query(statement.sql.replace(/\?/g, () => `$${++index}`), statement.values)).rows.length) throw conflict();
          }
          await client.query("COMMIT");
        } catch (error) { await client.query("ROLLBACK"); throw error; }
        finally { client.release(); }
      }
      return;
    }
    if (body.action === "submitReport") {
      if (actor.role !== "student")
        throw new ApiError(
          403,
          "FORBIDDEN",
          "Only students can submit reports.",
        );
      const rows = await query(
        `insert into internship_reports(id,application_id,student_id,week,content,created_at) select ?,id,student_id,?,?,? from internship_applications where id=? and student_id=? and status='approved' on conflict(application_id,week) do nothing returning id`,
        [
          randomUUID(),
          body.week,
          body.content,
          now,
          body.applicationId,
          actor.id,
        ],
      );
      if (!rows.length)
        throw new ApiError(
          409,
          "REPORT_NOT_SUBMITTED",
          "Choose your approved application and a week you have not submitted yet.",
        );
      return;
    }
    if (!["advisor", "admin"].includes(actor.role))
      throw new ApiError(403, "FORBIDDEN", "Only advisors can review records.");
    const scope =
      actor.role === "admin"
        ? "1=1"
        : "exists(select 1 from internship_assignments x where x.student_id=student_id and x.advisor_id=?)";
    // Qualify the outer student reference to avoid matching an assignment to itself.
    const table =
      body.action === "reviewApplication"
        ? "internship_applications"
        : "internship_reports";
    const qualified = scope.replace(
      "x.student_id=student_id",
      `x.student_id=${table}.student_id`,
    );
    const values: (string | number | null)[] =
      body.action === "reviewApplication"
        ? [body.status, body.note, now, body.id, body.version]
        : [body.feedback, now, body.id, body.version];
    if (actor.role !== "admin") values.push(actor.id);
    const rows = await query(
      body.action === "reviewApplication"
        ? `update internship_applications set status=?,review_note=?,updated_at=?,version=version+1 where id=? and version=? and status in ('submitted','under_review') and ${qualified} returning id`
        : `update internship_reports set feedback=?,reviewed_at=?,version=version+1 where id=? and version=? and ${qualified} returning id`,
      values,
    );
    if (!rows.length)
      throw new ApiError(
        409,
        "RECORD_UNAVAILABLE",
        "The record changed or is outside your assigned students. Refresh and try again.",
      );
  }
  return { query, migrate, read, assign, apply, mutate };
}
