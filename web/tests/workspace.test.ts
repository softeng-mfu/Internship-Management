import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { PGlite } from "@electric-sql/pglite";
import type { Pool } from "pg";
import { workspaceStore, type Actor } from "../src/lib/workspace";
import { ApiError } from "../src/lib/core";
for (const engine of ["sqlite", "postgres"] as const)
  test(`real ${engine} workspace: assigned students, isolated reviews, version conflicts and weekly reports`, async () => {
    const db =
      engine === "sqlite" ? new DatabaseSync(":memory:") : new PGlite();
    const store = workspaceStore(db as DatabaseSync | Pool);
    try {
      await store.query(
        'create table "user"(id text primary key,name text,role text,"studentId" text)',
      );
      await store.migrate();
      const student: Actor = {
          id: "s1",
          name: "Student One",
          studentId: "6731503001",
          role: "student",
          authSource: "student-identity",
        },
        other: Actor = {
          ...student,
          id: "s2",
          name: "Student Two",
          studentId: "6731503002",
        },
        advisor: Actor = { id: "a1", name: "Advisor One", role: "advisor" },
        outsider: Actor = { id: "a2", name: "Advisor Two", role: "advisor" };
      for (const user of [student, other, advisor, outsider])
        await store.query(
          'insert into "user"(id,name,role,"studentId") values(?,?,?,?)',
          [user.id, user.name, user.role, user.studentId || null],
        );
      await store.assign(student.id, advisor.id);
      await store.assign(other.id, outsider.id);
      const placement = {
        id: "10000000-0000-4000-8000-000000000002",
        title: "Frontend Internship",
        company: "Test Lab",
      };
      const app = await store.apply(
        student,
        placement,
        "I would like to learn frontend engineering.",
      );
      const otherApp = await store.apply(
        other,
        placement,
        "I would like to learn backend engineering.",
      );
      assert.equal((await store.read(student)).applications.length, 1);
      assert.equal((await store.read(advisor)).applications.length, 1);
      assert.equal((await store.read(advisor)).students[0].id, student.id);
      assert.equal((await store.read(outsider)).applications[0].id, otherApp);
      await assert.rejects(
        store.read({ ...student, authSource: "local" }),
        (e: unknown) => e instanceof ApiError && e.status === 403,
      );
      await assert.rejects(store.assign(advisor.id, student.id));
      await assert.rejects(
        store.apply(student, placement, "Duplicate statement"),
        (e: unknown) => e instanceof ApiError && e.status === 409,
      );
      await assert.rejects(
        store.mutate(student, {
          action: "reviewApplication",
          id: app,
          version: 1,
          status: "approved",
          note: "Self approval",
        }),
        (e: unknown) => e instanceof ApiError && e.status === 403,
      );
      await assert.rejects(
        store.mutate(outsider, {
          action: "reviewApplication",
          id: app,
          version: 1,
          status: "approved",
          note: "Wrong advisor",
        }),
        (e: unknown) => e instanceof ApiError && e.status === 409,
      );
      await assert.rejects(
        store.mutate(student, {
          action: "submitReport",
          applicationId: app,
          week: 1,
          content: "This internship is not approved yet.",
        }),
      );
      await store.mutate(advisor, {
        action: "reviewApplication",
        id: app,
        version: 1,
        status: "under_review",
        note: "Reviewing your goals.",
      });
      await assert.rejects(
        store.mutate(advisor, {
          action: "reviewApplication",
          id: app,
          version: 1,
          status: "approved",
          note: "Stale page",
        }),
      );
      await store.mutate(advisor, {
        action: "reviewApplication",
        id: app,
        version: 2,
        status: "approved",
        note: "Approved. Keep weekly notes.",
      });
      await assert.rejects(
        store.mutate(advisor, {
          action: "reviewApplication",
          id: app,
          version: 3,
          status: "rejected",
          note: "Final decisions cannot be overwritten here.",
        }),
      );
      await assert.rejects(
        store.mutate(other, {
          action: "submitReport",
          applicationId: app,
          week: 1,
          content: "Attempt to write another student report.",
        }),
      );
      await store.mutate(student, {
        action: "submitReport",
        applicationId: app,
        week: 1,
        content: "This week I learned how to build accessible components.",
      });
      await assert.rejects(
        store.mutate(student, {
          action: "submitReport",
          applicationId: app,
          week: 1,
          content: "Duplicate weekly submission should be rejected.",
        }),
      );
      const report = (await store.read(advisor)).reports[0];
      assert.equal((await store.read(outsider)).reports.length, 0);
      await assert.rejects(
        store.mutate(outsider, {
          action: "reviewReport",
          id: report.id,
          version: 1,
          feedback: "Unauthorized",
        }),
      );
      await store.mutate(advisor, {
        action: "reviewReport",
        id: report.id,
        version: 1,
        feedback: "Great progress. Include concrete examples next week.",
      });
      assert.equal(
        (await store.read(student)).reports[0].feedback,
        "Great progress. Include concrete examples next week.",
      );
      await store.assign(student.id, outsider.id);
      await assert.rejects(
        store.mutate(advisor, {
          action: "reviewReport",
          id: report.id,
          version: 2,
          feedback: "Assignment revoked",
        }),
      );
      assert.equal((await store.read(advisor)).students.length, 0);
    } finally {
      await db.close();
    }
  });
