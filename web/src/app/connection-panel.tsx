"use client";
import { useState } from "react";

export type ConnectionRequest = {
  id: string;
  student_name: string;
  student_number: string;
  advisor_name: string;
  message: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
};
export type Advisor = { id: string; name: string };

export default function ConnectionPanel({ advisorView, assignedAdvisor, advisors, requests, busy, submit }: {
  advisorView: boolean;
  assignedAdvisor: string | null;
  advisors: Advisor[];
  requests: ConnectionRequest[];
  busy: boolean;
  submit: (body: unknown) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const pending = requests.some((r) => r.status === "pending");
  const visible = advisors.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      {!advisorView && (
        <section className="full-panel">
          <h2>{assignedAdvisor ? `Your advisor: ${assignedAdvisor}` : "Find your advisor"}</h2>
          <p className="muted">
            {assignedAdvisor
              ? "You are connected. Your advisor can review your applications and weekly reports."
              : "Choose an advisor and introduce yourself. Once they accept, they can read your applications and reports. You can have one advisor and one pending request at a time."}
          </p>
          {!assignedAdvisor && (
            <>
              {pending && <p role="status">Your request is awaiting a response. You can cancel it below before choosing another advisor.</p>}
              <label className="connection-search">Search advisors
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Advisor name" />
              </label>
              {!advisors.length ? <p>No advisors have registered yet. Check back after your advisor creates an account.</p>
                : !visible.length ? <p>No advisors match your search.</p>
                : <div className="portal-grid">{visible.map((a) => (
                  <article className="portal-student" key={a.id}>
                    <span className="avatar" aria-hidden="true">{a.name.slice(0, 1)}</span>
                    <h3>{a.name}</h3>
                    <form className="portal-form" onSubmit={(e) => {
                      e.preventDefault();
                      void submit({ action: "requestAdvisor", advisorId: a.id, message: String(new FormData(e.currentTarget).get("message") || "") });
                    }}>
                      <label>Introduction to {a.name}
                        <textarea name="message" rows={3} required minLength={1} maxLength={2000} disabled={busy || pending} placeholder="Introduce yourself and explain what guidance you need." />
                      </label>
                      <button className="primary" disabled={busy || pending}>{busy ? "Saving…" : "Send connection request"}</button>
                    </form>
                  </article>
                ))}</div>}
            </>
          )}
        </section>
      )}
      <section className="full-panel">
        <h2>Connection requests <span className="count-pill">{requests.filter((r) => r.status === "pending").length} pending</span></h2>
        <p className="muted">{advisorView ? "Accept a student to add them to your student list and review their reports. Pending requests only share the student's name, ID and introduction." : "Track your advisor requests and their decisions."}</p>
        {!requests.length && <p>{advisorView ? "No connection requests yet. Students can find you in their Advisors tab." : "You haven't sent a connection request yet."}</p>}
        {requests.map((r) => (
          <article className="portal-record" key={r.id}>
            <div className="section-heading">
              <div><h3>{advisorView ? r.student_name : r.advisor_name}</h3><p className="muted">{advisorView ? `${r.student_number} · ` : ""}{new Date(r.created_at).toLocaleDateString()}</p></div>
              <span className={`portal-status ${r.status === "accepted" ? "approved" : r.status}`}>{r.status}</span>
            </div>
            <p className="portal-content">{r.message}</p>
            {r.status === "pending" && <div className="connection-actions">
              {advisorView ? <>
                <button className="primary" disabled={busy} onClick={() => void submit({ action: "respondAdvisorRequest", id: r.id, decision: "accepted" })}>Accept student</button>
                <button className="secondary" disabled={busy} onClick={() => void submit({ action: "respondAdvisorRequest", id: r.id, decision: "rejected" })}>Reject request</button>
              </> : <button className="secondary" disabled={busy} onClick={() => void submit({ action: "cancelAdvisorRequest", id: r.id })}>Cancel request</button>}
            </div>}
          </article>
        ))}
      </section>
    </>
  );
}
