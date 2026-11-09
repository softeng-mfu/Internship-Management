"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import PlacementBrowser from "./placement-browser";
import ActivityPanel from "./activity-panel";
import IdentityPanel from "./identity-panel";
import ConnectionPanel, { type Advisor, type ConnectionRequest } from "./connection-panel";
type Application = {
  id: string;
  student_id: string;
  student_name: string;
  student_number: string;
  title: string;
  company: string;
  status: string;
  statement: string;
  review_note: string;
  version: number;
  created_at: string;
};
type Report = {
  id: string;
  student_id: string;
  student_name: string;
  student_number: string;
  title: string;
  company: string;
  week: number;
  content: string;
  feedback: string;
  version: number;
  created_at: string;
};
type Student = {
  id: string;
  name: string;
  student_number: string;
  advisor_id: string | null;
};
type Workspace = {
  role: string;
  students: Student[];
  applications: Application[];
  reports: Report[];
  advisor: string | null;
  advisors: Advisor[];
  connectionRequests: ConnectionRequest[];
};
type Opportunity = { id: string; title: string; company: string };
export default function Portal({
  initialTab = "Overview",
  initialPlacement,
  initialRole = "student",
}: {
  initialTab?: string;
  initialPlacement?: string;
  initialRole?: string;
}) {
  const { data: session } = authClient.useSession();
  const [data, setData] = useState<Workspace | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialTab),
    [student, setStudent] = useState("all"),
    [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [chosenPlacement, setChosenPlacement] = useState<Opportunity | null>(
    null,
  );
  const [integration, setIntegration] = useState("Activity");
  const [catalogueRevision, setCatalogueRevision] = useState(0);
  function navigate(name: string) {
    setTab(name);
    setStudent("all");
    const values: Record<string, string> = {
      Overview: "overview",
      Opportunities: "opportunities",
      Students: "students",
      Advisors: "advisors",
      Applications: "applications",
      "Progress reports": "reports",
      Integrations: "integrations",
    };
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?tab=${values[name] || "overview"}`,
    );
  }
  const [review, setReview] = useState<Application | null>(null),
    [report, setReport] = useState<Report | null>(null),
    [dialog, setDialog] = useState<"apply" | "report" | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const dialogOpen = Boolean(review || report || dialog);
  useEffect(() => {
    if (!dialogOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current
      ?.querySelector<HTMLElement>("textarea, input, select, button")
      ?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [dialogOpen]);
  async function load(signal?: AbortSignal) {
    try {
      const response = await fetch("/api/workspace", {
        cache: "no-store",
        signal,
      });
      const body = await response.json();
      if (response.status === 401 || response.status === 403) setData(null);
      if (!response.ok)
        throw new Error(
          body.error?.message || "Unable to load your workspace.",
        );
      if (body.data.role !== initialRole) {
        setData(null);
        window.location.replace(body.data.role === "student" ? "/workspace" : "/advisor");
        return;
      }
      setData(body.data);
      setError("");
    } catch (e) {
      if (!signal?.aborted)
        setError(e instanceof Error ? e.message : "Connection unavailable.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => { void load(controller.signal); };
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refresh);
    };
  }, [initialRole]);
  useEffect(() => {
    if (data?.role !== "student") return;
    const controller = new AbortController();
    fetch("/api/jobs?limit=50", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((body) => setOpportunities(body.data))
      .catch(() => {});
    return () => controller.abort();
  }, [data?.role]);
  useEffect(() => {
    if (
      data?.role !== "student" ||
      !initialPlacement ||
      !/^(?:[0-9a-f-]{36}|jobboard-[1-9]\d{0,9})$/i.test(initialPlacement)
    )
      return;
    const controller = new AbortController();
    fetch(
      (initialPlacement.startsWith("jobboard-")
        ? "/api/jobs/"
        : "/api/placements/") + initialPlacement,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error("This opportunity is no longer available.");
        if (!controller.signal.aborted) {
          setChosenPlacement(body.data);
          setDialog("apply");
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load opportunity.",
          );
      });
    return () => controller.abort();
  }, [data?.role, initialPlacement]);
  const role = data?.role || initialRole;
  const advisor = role === "advisor" || role === "admin";
  const approvedApplications = data?.applications.filter((a) => a.status === "approved") || [];
  const awaitingApproval = data?.applications.some((a) => ["submitted", "under_review"].includes(a.status));
  useEffect(() => {
    if (dialog === "report" && data && !approvedApplications.length) setDialog(null);
  }, [dialog, data, approvedApplications.length]);
  const apps =
      data?.applications.filter(
        (a) => student === "all" || a.student_id === student,
      ) || [],
    reports =
      data?.reports.filter(
        (r) => student === "all" || r.student_id === student,
      ) || [];
  async function submit(body: unknown) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error?.message || "Unable to save.");
      setReview(null);
      setReport(null);
      setDialog(null);
      setNotice("Saved successfully.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <Link href="/" className="auth-brand">
          internly<span>.</span>
        </Link>
        <p className="eyebrow">
          {advisor ? "ADVISOR WORKSPACE" : "STUDENT WORKSPACE"}
        </p>
        <nav aria-label="Workspace navigation">
          {(advisor
            ? [
                "Overview",
                "Students",
                "Applications",
                "Progress reports",
                "Opportunities",
                "Integrations",
              ]
            : [
                "Overview",
                "Advisors",
                "Opportunities",
                "Applications",
                "Progress reports",
                "Integrations",
              ]
          ).map((name) => (
            <button
              key={name}
              aria-current={tab === name ? "page" : undefined}
              onClick={() => {
                navigate(name);
              }}
            >
              {name}
              <span>↗</span>
            </button>
          ))}
        </nav>
        <div className="portal-profile">
          <strong>{session?.user.name || "Your workspace"}</strong>
          <small>
            {advisor ? "Advisor" : "Student"}
            {session?.user.studentId ? ` · ${session.user.studentId}` : ""}
          </small>
          <button
            className="text-button"
            onClick={async () => {
              const result = await authClient.signOut();
              if (result.error) setError("Unable to sign out. Please retry.");
              else window.location.assign("/sign-in");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="portal-main">
        <header className="portal-header">
          <div>
            <span className="eyebrow">
              {advisor
                ? "A LITTLE GUIDANCE. A LASTING IMPACT."
                : "YOUR LEARNING, IN MOTION."}
            </span>
            <h1>
              {tab === "Overview"
                ? advisor
                  ? "Help potential take shape."
                  : "Your next chapter."
                : tab}
            </h1>
            <p className="muted">
              {advisor
                ? "Review applications and support the students assigned to you."
                : `Real applications and weekly progress.${data?.advisor ? ` Your advisor: ${data.advisor}.` : " Open Advisors to request a connection."}`}
            </p>
          </div>
          {tab !== "Integrations" && (
            <button
              className="secondary"
              disabled={busy || loading}
              onClick={() => {
                if (tab === "Opportunities")
                  setCatalogueRevision((value) => value + 1);
                else void load();
              }}
            >
              Refresh ↻
            </button>
          )}
        </header>
        {notice && (
          <p className="portal-notice" role="status">
            {notice}
          </p>
        )}
        {error && (
          <div className="connection-error" role="alert">
            {error} <Link href="/sign-in">Sign in</Link>
          </div>
        )}
        {loading ? (
          <section className="full-panel">Loading your workspace…</section>
        ) : (
          data && (
            <>
              {tab === "Opportunities" && (
                <PlacementBrowser
                  key={catalogueRevision}
                  onApply={
                    !advisor
                      ? (placement) => {
                          setChosenPlacement(placement);
                          setDialog("apply");
                        }
                      : undefined
                  }
                />
              )}
              {tab === "Integrations" && (
                <>
                  <div
                    className="integration-tabs"
                    aria-label="Integration views"
                  >
                    {["Activity", "Student Identity"].map((name) => (
                      <button
                        key={name}
                        type="button"
                        aria-pressed={integration === name}
                        onClick={() => setIntegration(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  {integration === "Activity" ? (
                    <ActivityPanel />
                  ) : (
                    <IdentityPanel />
                  )}
                </>
              )}
              {tab === "Overview" && (
                <>
                  {(!data.advisor || advisor) && <section className="full-panel">
                    <h2>{advisor ? "Student connections" : "Connect with your advisor"}</h2>
                    <p className="muted">{advisor ? `${data.connectionRequests.filter((r) => r.status === "pending").length} connection requests awaiting your response.` : "Choose an advisor and send an introduction to start sharing your applications and reports."}</p>
                    <button className="secondary" onClick={() => navigate(advisor ? "Students" : "Advisors")}>{advisor ? "View students and requests →" : "Find an advisor →"}</button>
                  </section>}
                  <section className="portal-banner">
                    <span className="eyebrow">CONNECTED TO YOUR WORKSPACE</span>
                    <h2>
                      {advisor
                        ? "Small steps. Meaningful progress."
                        : "From opportunity to experience."}
                    </h2>
                    <p>
                      {advisor
                        ? "Every review is a chance to help a student move forward."
                        : "Apply for an internship, follow your review, and reflect on what you learn."}
                    </p>
                    {!advisor && (
                      <button
                        className="primary"
                        onClick={() => navigate("Opportunities")}
                      >
                        Explore opportunities →
                      </button>
                    )}
                  </section>
                  <div className="portal-stats">
                    {(advisor
                      ? [
                          ["Assigned students", data.students.length],
                          [
                            "Applications to review",
                            apps.filter((a) =>
                              ["submitted", "under_review"].includes(a.status),
                            ).length,
                          ],
                          [
                            "Reports awaiting feedback",
                            reports.filter((r) => !r.feedback).length,
                          ],
                        ]
                      : [
                          ["Applications", apps.length],
                          [
                            "Approved",
                            apps.filter((a) => a.status === "approved").length,
                          ],
                          ["Progress reports", reports.length],
                        ]
                    ).map(([label, value]) => (
                      <div key={label} className="portal-stat">
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>

                  <section className="full-panel">
                    <h2>
                      {advisor
                        ? "Your review queue"
                        : "Your latest applications"}
                    </h2>
                    <p className="muted">
                      {advisor
                        ? "Open Applications to review statements and record a decision."
                        : "Your advisor’s decisions and notes will appear here."}
                    </p>
                    {apps.length > 0 ? (
                      <div className="overview-applications">
                        {apps.slice(0, 3).map((application) => (
                          <button
                            key={application.id}
                            className="overview-application"
                            onClick={() => navigate("Applications")}
                          >
                            <span>
                              <strong>{application.title}</strong>
                              <small>{application.company}</small>
                            </span>
                            <span
                              className={`portal-status ${application.status}`}
                            >
                              {application.status.replace("_", " ")}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="muted">
                        {advisor
                          ? "Your assigned students’ applications will appear here."
                          : "Your first application starts with an opportunity that interests you."}
                      </p>
                    )}
                    <button
                      className="secondary"
                      onClick={() => navigate("Applications")}
                    >
                      View applications →
                    </button>
                  </section>
                </>
              )}
              {((tab === "Advisors" && !advisor) || (tab === "Students" && role === "advisor")) && (
                <ConnectionPanel advisorView={advisor} assignedAdvisor={data.advisor} advisors={data.advisors} requests={data.connectionRequests} busy={busy} submit={submit} />
              )}
              {tab === "Students" && advisor && (
                <section className="full-panel">
                  <h2>
                    Assigned students{" "}
                    <span className="count-pill">{data.students.length}</span>
                  </h2>
                  {!data.students.length ? (
                    <Empty text="No students connected yet. Accept a student's connection request above to start reviewing their applications and reports." />
                  ) : (
                    <div className="portal-grid">
                      {data.students.map((s) => (
                        <article className="portal-student" key={s.id}>
                          <span className="avatar">{s.name.slice(0, 1)}</span>
                          <h3>{s.name}</h3>
                          <p>{s.student_number}</p>
                          <p className="muted">
                            {
                              data.applications.filter(
                                (a) => a.student_id === s.id,
                              ).length
                            }{" "}
                            applications ·{" "}
                            {
                              data.reports.filter((r) => r.student_id === s.id)
                                .length
                            }{" "}
                            reports
                          </p>
                          <button
                            className="secondary"
                            onClick={() => {
                              setStudent(s.id);
                              setTab("Applications");
                            }}
                          >
                            View applications
                          </button>
                          <button
                            className="text-button"
                            onClick={() => {
                              setStudent(s.id);
                              setTab("Progress reports");
                            }}
                          >
                            View reports →
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
              {["Applications", "Progress reports"].includes(tab) && (
                <>
                  <div className="section-heading">
                    <div>
                      <h2>{tab}</h2>
                      <p className="muted">
                        {advisor
                          ? "Only assigned student records are available."
                          : "Saved in the application database."}
                      </p>
                    </div>
                    {advisor ? (
                      <label>
                        Student{" "}
                        <select
                          value={student}
                          onChange={(e) => setStudent(e.target.value)}
                        >
                          <option value="all">All assigned students</option>
                          {data.students.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} · {s.student_number}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <button
                        className="primary"
                        disabled={busy || (tab === "Progress reports" && !approvedApplications.length)}
                        onClick={() =>
                          tab === "Applications"
                            ? navigate("Opportunities")
                            : setDialog("report")
                        }
                      >
                        {tab === "Applications"
                          ? "New application"
                          : "Write progress report"}{" "}
                        +
                      </button>
                    )}
                  </div>
                  {tab === "Progress reports" && !advisor && !approvedApplications.length && (
                    <section className="full-panel" role="status">
                      <h2>{awaitingApproval ? "Your internship is awaiting approval" : "An approved internship is needed"}</h2>
                      <p className="muted">
                        {awaitingApproval
                          ? `Your application is still submitted or under review. ${data.advisor ? `Ask ${data.advisor} to review it in their Applications tab.` : "Connect with an advisor in the Advisors tab so they can review it."} Once approved, you can write weekly reports here.`
                          : "Apply for an internship and have your advisor approve the application. Weekly reports will then be available here."}
                      </p>
                      <button className="secondary" onClick={() => navigate(data.applications.length ? "Applications" : "Opportunities")}>
                        {data.applications.length ? "View your applications →" : "Find an internship →"}
                      </button>
                      {!data.advisor && <button className="text-button" onClick={() => navigate("Advisors")}>Connect with an advisor →</button>}
                    </section>
                  )}
                  {tab === "Applications" ? (
                    <section className="full-panel">
                      {!apps.length ? (
                        <Empty text="No applications yet. Find an opportunity and submit your first application." />
                      ) : (
                        apps.map((a) => (
                          <article className="portal-record" key={a.id}>
                            <div className="section-heading">
                              <div>
                                <span className="eyebrow">{a.company}</span>
                                <h3>{a.title}</h3>
                                <p className="muted">
                                  {advisor
                                    ? `${a.student_name} · ${a.student_number} · `
                                    : ""}
                                  {new Date(a.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`portal-status ${a.status}`}>
                                {a.status.replace("_", " ")}
                              </span>
                            </div>
                            <p className="portal-content">{a.statement}</p>
                            {a.review_note && (
                              <div className="portal-feedback">
                                <strong>Advisor note</strong>
                                <p>{a.review_note}</p>
                              </div>
                            )}
                            {advisor &&
                              ["submitted", "under_review"].includes(
                                a.status,
                              ) && (
                                <button
                                  className="secondary"
                                  onClick={() => setReview(a)}
                                >
                                  Review application →
                                </button>
                              )}
                          </article>
                        ))
                      )}
                    </section>
                  ) : (
                    <section className="full-panel">
                      {!reports.length ? (
                        <>
                          <Empty text={advisor
                            ? "No reports from these students yet. Review their internship applications first. After approval, students can submit weekly reports for your feedback."
                            : "No reports yet. Submit a weekly report for an approved internship to share your progress with your advisor."} />
                          {advisor && <button className="secondary" onClick={() => setTab("Applications")}>Review internship applications →</button>}
                        </>
                      ) : (
                        reports.map((r) => (
                          <article className="portal-record" key={r.id}>
                            <div className="section-heading">
                              <div>
                                <span className="eyebrow">
                                  WEEK {r.week} · {r.company}
                                </span>
                                <h3>{r.title}</h3>
                                <p className="muted">
                                  {advisor
                                    ? `${r.student_name} · ${r.student_number}`
                                    : new Date(
                                        r.created_at,
                                      ).toLocaleDateString()}
                                </p>
                              </div>
                              <span className="count-pill">
                                {r.feedback ? "Reviewed" : "Awaiting feedback"}
                              </span>
                            </div>
                            <p className="portal-content">{r.content}</p>
                            {r.feedback && (
                              <div className="portal-feedback">
                                <strong>Advisor feedback</strong>
                                <p>{r.feedback}</p>
                              </div>
                            )}
                            {advisor && (
                              <button
                                className="secondary"
                                onClick={() => setReport(r)}
                              >
                                {r.feedback
                                  ? "Update feedback"
                                  : "Give feedback"}{" "}
                                →
                              </button>
                            )}
                          </article>
                        ))
                      )}
                    </section>
                  )}
                </>
              )}
            </>
          )
        )}
        {(review || report || dialog) && (
          <div className="modal-backdrop">
            <section
              className="portal-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="portal-dialog-title"
              ref={dialogRef}
              onKeyDown={(event) => {
                if (event.key === "Escape" && !busy) {
                  setReview(null);
                  setReport(null);
                  setDialog(null);
                }
                if (event.key !== "Tab") return;
                const controls = Array.from(
                  event.currentTarget.querySelectorAll<HTMLElement>(
                    "button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href]",
                  ),
                );
                const first = controls[0],
                  last = controls[controls.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first?.focus();
                }
              }}
            >
              <button
                className="portal-close"
                aria-label="Close dialog"
                disabled={busy}
                onClick={() => {
                  setReview(null);
                  setReport(null);
                  setDialog(null);
                }}
              >
                ×
              </button>
              <h2 id="portal-dialog-title">
                {review
                  ? "Review application"
                  : report
                    ? "Progress feedback"
                    : dialog === "apply"
                      ? "Start your application"
                      : "Your weekly reflection"}
              </h2>
              <p className="muted">
                {review
                  ? `${review.student_name} · ${review.title}`
                  : report
                    ? `${report.student_name} · Week ${report.week}`
                    : "Share your goals and progress with your advisor."}
              </p>
              <form
                className="portal-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget),
                    text = String(form.get("text") || "");
                  void submit(
                    review
                      ? {
                          action: "reviewApplication",
                          id: review.id,
                          version: review.version,
                          status: form.get("status"),
                          note: text,
                        }
                      : report
                        ? {
                            action: "reviewReport",
                            id: report.id,
                            version: report.version,
                            feedback: text,
                          }
                        : dialog === "apply"
                          ? {
                              action: "apply",
                              placementId: form.get("placement"),
                              statement: text,
                            }
                          : {
                              action: "submitReport",
                              applicationId: form.get("application"),
                              week: Number(form.get("week")),
                              content: text,
                            },
                  );
                }}
              >
                {review && (
                  <label>
                    Decision
                    <select name="status" defaultValue="under_review">
                      <option value="under_review">Under review</option>
                      <option value="approved">Approve</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </label>
                )}
                {dialog === "apply" && (
                  <label>
                    Opportunity
                    <select
                      name="placement"
                      required
                      defaultValue={chosenPlacement?.id || ""}
                    >
                      <option value="">Choose an opportunity</option>
                      {chosenPlacement &&
                        !opportunities.some(
                          (p) => p.id === chosenPlacement.id,
                        ) && (
                          <option value={chosenPlacement.id}>
                            {chosenPlacement.title} · {chosenPlacement.company}
                          </option>
                        )}
                      {opportunities.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} · {p.company}
                        </option>
                      ))}
                    </select>
                    {!opportunities.length && (
                      <small>
                        No opportunities available. Refresh or browse the
                        catalogue.
                      </small>
                    )}
                  </label>
                )}
                {dialog === "report" && (
                  <>
                    <label>
                      Approved internship
                      <select name="application" required defaultValue={approvedApplications.length === 1 ? approvedApplications[0].id : ""}>
                        <option value="">Choose your internship</option>
                        {approvedApplications
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.title} · {a.company}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Week
                      <input
                        name="week"
                        type="number"
                        min={1}
                        max={52}
                        required
                        defaultValue={1}
                      />
                    </label>
                  </>
                )}
                <label>
                  {review
                    ? "Review note"
                    : report
                      ? "Feedback"
                      : dialog === "apply"
                        ? "Why are you interested?"
                        : "What did you learn this week?"}
                  <textarea
                    autoFocus
                    name="text"
                    rows={6}
                    required
                    minLength={review || report ? 1 : 20}
                    maxLength={
                      review
                        ? 3000
                        : report
                          ? 5000
                          : dialog === "apply"
                            ? 5000
                            : 10000
                    }
                    defaultValue={report?.feedback || ""}
                  />
                </label>
                {error && (
                  <p className="connection-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="primary" disabled={busy || (dialog === "report" && !approvedApplications.length)}>
                  {busy ? "Saving…" : "Save and continue →"}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <h3>A little room for what’s next.</h3>
      <p>{text}</p>
    </div>
  );
}
