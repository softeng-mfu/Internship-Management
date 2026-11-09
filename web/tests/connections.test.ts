import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { PGlite } from "@electric-sql/pglite";
import type { Pool } from "pg";
import { workspaceStore, type Actor } from "../src/lib/workspace";
import { ApiError } from "../src/lib/core";

for (const engine of ["sqlite", "postgres"] as const) {
  test(`${engine}: student-requested advisor connections enforce ownership, one advisor and report access`, async () => {
    const db = engine === "sqlite" ? new DatabaseSync(":memory:") : new PGlite();
    // Exercise the production Pool transaction path against a real PostgreSQL engine.
    const database = db instanceof DatabaseSync ? db : {
      query: db.query.bind(db),
      connect: async () => ({ query: db.query.bind(db), release() {} }),
    } as unknown as Pool;
    const store = workspaceStore(database);
    const conflict = (error: unknown) => error instanceof ApiError && error.status === 409;
    const forbidden = (error: unknown) => error instanceof ApiError && error.status === 403;
    const student: Actor = { id: "s1", name: "Student One", role: "student", studentId: "6731503001", authSource: "student-identity" };
    const other: Actor = { ...student, id: "s2", name: "Student Two", studentId: "6731503002" };
    const third: Actor = { ...student, id: "s3", name: "Student Three", studentId: "6731503003" };
    const advisor: Actor = { id: "a1", name: "Advisor One", role: "advisor" };
    const outsider: Actor = { id: "a2", name: "Advisor Two", role: "advisor" };
    const admin: Actor = { id: "admin", name: "Administrator", role: "admin" };
    try {
      await store.query('create table "user"(id text primary key,name text,role text,"studentId" text)');
      await store.migrate();
      await store.migrate();
      for (const user of [student, other, third, advisor, outsider, admin])
        await store.query('insert into "user"(id,name,role,"studentId") values(?,?,?,?)', [user.id, user.name, user.role, user.studentId || null]);
      assert.deepEqual((await store.read(student)).advisors.map((a) => ({ ...a })), [{ id: advisor.id, name: advisor.name }, { id: outsider.id, name: outsider.name }]);
      await assert.rejects(store.mutate(advisor, { action: "requestAdvisor", advisorId: outsider.id, message: "Not a student" }), forbidden);
      await assert.rejects(store.mutate({ ...student, authSource: "local" }, { action: "requestAdvisor", advisorId: advisor.id, message: "Unverified" }), forbidden);
      await assert.rejects(store.mutate(student, { action: "requestAdvisor", advisorId: admin.id, message: "Not an advisor" }), conflict);
      await assert.rejects(store.mutate(student, { action: "requestAdvisor", advisorId: other.id, message: "Wrong role" }), conflict);
      await assert.rejects(store.mutate(student, { action: "requestAdvisor", advisorId: advisor.id, message: "  " }));
      await assert.rejects(store.mutate(student, { action: "requestAdvisor", advisorId: advisor.id, message: "Introduction", studentId: other.id }));
      const app = await store.apply(student, { id: "10000000-0000-4000-8000-000000000002", title: "Internship", company: "Lab" }, "My goals for this internship.");
      await store.mutate(student, { action: "requestAdvisor", advisorId: advisor.id, message: "Please guide my internship." });
      const request = (await store.read(student)).connectionRequests[0];
      assert.equal(request.status, "pending");
      assert.equal((await store.read(advisor)).connectionRequests[0].student_number, student.studentId);
      assert.equal((await store.read(advisor)).students.length, 0);
      assert.equal((await store.read(advisor)).applications.length, 0);
      assert.equal((await store.read(outsider)).connectionRequests.length, 0);
      assert.equal((await store.read(other)).connectionRequests.length, 0);
      await assert.rejects(store.mutate(student, { action: "requestAdvisor", advisorId: outsider.id, message: "Second pending request" }), conflict);
      await assert.rejects(store.mutate(outsider, { action: "respondAdvisorRequest", id: request.id, decision: "accepted" }), conflict);
      await assert.rejects(store.mutate(student, { action: "respondAdvisorRequest", id: request.id, decision: "accepted" }), forbidden);
      await assert.rejects(store.mutate(other, { action: "cancelAdvisorRequest", id: request.id }), conflict);
      await store.mutate(student, { action: "cancelAdvisorRequest", id: request.id });
      await assert.rejects(store.mutate(advisor, { action: "respondAdvisorRequest", id: request.id, decision: "accepted" }), conflict);
      await store.mutate(student, { action: "requestAdvisor", advisorId: advisor.id, message: "New introduction" });
      const second = (await store.read(advisor)).connectionRequests.find((r) => r.status === "pending")!;
      await store.mutate(advisor, { action: "respondAdvisorRequest", id: second.id, decision: "rejected" });
      assert.equal((await store.read(student)).advisor, null);
      await store.mutate(student, { action: "requestAdvisor", advisorId: advisor.id, message: "Updated introduction" });
      const accepted = (await store.read(student)).connectionRequests.find((r) => r.status === "pending")!;
      await store.mutate(advisor, { action: "respondAdvisorRequest", id: accepted.id, decision: "accepted" });
      assert.equal((await store.read(student)).advisor, advisor.name);
      assert.equal((await store.read(advisor)).students[0].id, student.id);
      assert.equal((await store.read(advisor)).applications[0].id, app);
      await assert.rejects(store.mutate(student, { action: "requestAdvisor", advisorId: outsider.id, message: "Second advisor" }), conflict);
      await assert.rejects(store.mutate(student, { action: "cancelAdvisorRequest", id: accepted.id }), conflict);
      await assert.rejects(store.mutate(advisor, { action: "respondAdvisorRequest", id: accepted.id, decision: "accepted" }), conflict);
      await store.mutate(advisor, { action: "reviewApplication", id: app, version: 1, status: "approved", note: "Approved internship" });
      await store.mutate(student, { action: "submitReport", applicationId: app, week: 1, content: "This week I learned to build and test accessible interfaces." });
      const report = (await store.read(advisor)).reports[0];
      assert.equal((await store.read(outsider)).reports.length, 0);
      await assert.rejects(store.mutate(outsider, { action: "reviewReport", id: report.id, version: 1, feedback: "Not allowed" }), conflict);
      await store.mutate(advisor, { action: "reviewReport", id: report.id, version: 1, feedback: "Good progress. Keep testing." });
      assert.equal((await store.read(student)).reports[0].feedback, "Good progress. Keep testing.");
      await store.mutate(other, { action: "requestAdvisor", advisorId: advisor.id, message: "Please advise me too" });
      const otherRequest = (await store.read(other)).connectionRequests[0];
      await store.mutate(advisor, { action: "respondAdvisorRequest", id: otherRequest.id, decision: "accepted" });
      assert.equal((await store.read(advisor)).students.length, 2);
      await store.mutate(third, { action: "requestAdvisor", advisorId: advisor.id, message: "Please advise my internship" });
      const thirdRequest = (await store.read(third)).connectionRequests[0];
      // A trusted assignment made after the request must never be overwritten by acceptance.
      await store.assign(third.id, outsider.id);
      await assert.rejects(store.mutate(advisor, { action: "respondAdvisorRequest", id: thirdRequest.id, decision: "accepted" }), conflict);
      assert.equal((await store.read(third)).connectionRequests[0].status, "pending", "failed acceptance rolls back the request decision");
      assert.equal((await store.read(third)).advisor, outsider.name);
      await store.mutate(third, { action: "cancelAdvisorRequest", id: thirdRequest.id });
      assert.equal((await store.read(advisor)).students.length, 2);
      assert.equal((await store.query("select * from internship_assignments where student_id=?", [student.id])).length, 1);
    } finally { await db.close(); }
  });
}
